import { Response } from "express";
import mongoose from "mongoose";
import Space from "../models/space.model";
import User from "../models/user.model";
import { checkAllString, getUniqueValues } from "../utils/helpers";
import validator from "validator";
import {
  BOARD,
  BOARD_MEMBER_ROLES,
  BOARD_VISIBILITY,
  SPACE,
  SPACE_MEMBER_ROLES,
} from "../types/constants";
import { isAfter, isEqual } from "date-fns";
import Favorite from "../models/favorite.model";
import Board from "../models/board.model";

// GET /spaces -> get space and its corresponding boards (for sidebar)
export const getSpaces = async (req: any, res: Response) => {
  try {
    // find all spaces in which i am an admin/normal/guest
    const allSpaces = await Space.find({
      members: {
        $elemMatch: {
          memberId: req.user._id,
        },
      },
    })
      .select("_id name icon members createdAt")
      .lean()
      .populate({
        path: "boards",
        select: "_id name color members visibility createdAt",
      })
      .sort({ createdAt: 1 });

    const neededSpaceDetails = allSpaces.map(async (space: any) => {
      const favorite = await Favorite.findOne({
        resourceId: space._id,
        userId: req.user._id,
        type: SPACE,
      });

      // find current user's role in this space role
      const role = space.members.find(
        (m: any) => m.memberId.toString() === req.user._id.toString()
      ).role;

      // split boards into two -> current user is actual member, not actual member
      const myBoards = space.boards.filter((board: any) =>
        board.members
          .map((m: any) => m.memberId.toString())
          .includes(req.user._id.toString())
      );
      // boards other than i am part of
      const notMyBoards = space.boards.filter(
        (board: any) =>
          !myBoards
            .map((b: any) => b._id.toString())
            .includes(board._id.toString())
      );

      // if current user is admin of space, show them all boards, board role determine -> take corresponding role from boards which he is member of + set isMember=true and for rest of the boards, give his role=ADMIN + set isMember=false
      if (role === SPACE_MEMBER_ROLES.ADMIN) {
        const totalBoards = [
          ...(await Promise.all(
            myBoards.map(async (b: any) => {
              const favorite = await Favorite.findOne({
                resourceId: b._id,
                userId: req.user._id,
                type: BOARD,
              });

              return {
                _id: b._id,
                name: b.name,
                isMember: true,
                color: b.color,
                visibility: b.visibility,
                isFavorite: favorite ? true : false,
                favoriteId: favorite && favorite._id,
                createdAt: b.createdAt,
                role: b.members.find(
                  (board: any) =>
                    board.memberId.toString() === req.user._id.toString()
                ).role,
              };
            })
          )),
          ...(await Promise.all(
            notMyBoards.map(async (b: any) => {
              const favorite = await Favorite.findOne({
                resourceId: b._id,
                userId: req.user._id,
                type: BOARD,
              });

              return {
                _id: b._id,
                name: b.name,
                visibility: b.visibility,
                isFavorite: favorite ? true : false,
                favoriteId: favorite && favorite._id,
                createdAt: b.createdAt,
                isMember: false,
                color: b.color,
                role: BOARD_MEMBER_ROLES.ADMIN,
              };
            })
          )),
        ].sort(function (a: any, b: any) {
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return isEqual(b.createdAt, a.createdAt)
            ? 0
            : isAfter(b.createdAt, a.createdAt)
            ? -1
            : 1;
        });

        return {
          _id: space._id,
          name: space.name,
          role: role,
          isFavorite: favorite ? true : false,
          favoriteId: favorite && favorite._id,
          icon: space.icon,
          boards: totalBoards.map((b: any) => {
            delete b.createdAt;

            return b;
          }),
        };
      } else if (role === SPACE_MEMBER_ROLES.NORMAL) {
        // if current user is normal user in space, find all board which he is part of and take corresponding roles from them + set isMember = true, then take only public boards from otherBoards and set role=NORMAL + set isMember=false
        const totalBoards = [
          ...(await Promise.all(
            myBoards.map(async (b: any) => {
              const favorite = await Favorite.findOne({
                resourceId: b._id,
                userId: req.user._id,
                type: BOARD,
              });

              return {
                _id: b._id,
                name: b.name,
                isMember: true,
                visibility: b.visibility,
                isFavorite: favorite ? true : false,
                favoriteId: favorite && favorite._id,
                color: b.color,
                createdAt: b.createdAt,
                role: b.members.find(
                  (board: any) =>
                    board.memberId.toString() === req.user._id.toString()
                ).role,
              };
            })
          )),
          ...(await Promise.all(
            notMyBoards
              .filter((b: any) => b.visibility === BOARD_VISIBILITY.PUBLIC)
              .map(async (b: any) => {
                const favorite = await Favorite.findOne({
                  resourceId: b._id,
                  userId: req.user._id,
                  type: BOARD,
                });

                return {
                  _id: b._id,
                  name: b.name,
                  isMember: false,
                  visibility: b.visibility,
                  isFavorite: favorite ? true : false,
                  favoriteId: favorite && favorite._id,
                  createdAt: b.createdAt,
                  color: b.color,
                  role: BOARD_MEMBER_ROLES.NORMAL,
                };
              })
          )),
        ].sort(function (a: any, b: any) {
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return isEqual(b.createdAt, a.createdAt)
            ? 0
            : isAfter(b.createdAt, a.createdAt)
            ? -1
            : 1;
        });

        return {
          _id: space._id,
          name: space.name,
          isFavorite: favorite ? true : false,
          favoriteId: favorite && favorite._id,
          role: role,
          icon: space.icon,
          boards: totalBoards.map((b: any) => {
            delete b.createdAt;

            return b;
          }),
        };
      } else if (role === SPACE_MEMBER_ROLES.GUEST) {
        // if current user is guest user in space, find all board which he is part of and take corresponding roles from them + set isMember = true, that's it
        const totalBoards = [
          ...(await Promise.all(
            myBoards.map(async (b: any) => {
              const favorite = await Favorite.findOne({
                resourceId: b._id,
                userId: req.user._id,
                type: BOARD,
              });

              return {
                _id: b._id,
                name: b.name,
                isMember: true,
                visibility: b.visibility,
                isFavorite: favorite ? true : false,
                favoriteId: favorite && favorite._id,
                createdAt: b.createdAt,
                color: b.color,
                role: b.members.find(
                  (board: any) =>
                    board.memberId.toString() === req.user._id.toString()
                ).role,
              };
            })
          )),
        ].sort(function (a: any, b: any) {
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return isEqual(b.createdAt, a.createdAt)
            ? 0
            : isAfter(b.createdAt, a.createdAt)
            ? -1
            : 1;
        });

        return {
          _id: space._id,
          name: space.name,
          role: role,
          isFavorite: favorite ? true : false,
          favoriteId: favorite && favorite._id,
          icon: space.icon,
          boards: totalBoards.map((b: any) => {
            delete b.createdAt;

            return b;
          }),
        };
      }
    });

    res.send({
      success: true,
      data: await Promise.all(neededSpaceDetails),
      message: "",
      statusCode: 200,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      data: {},
      message: "Oops, something went wrong!",
      statusCode: 500,
    });
  }
};

// POST /spaces -> create a new space
export const createSpace = async (req: any, res: Response) => {
  try {
    const { name, description, members } = req.body;

    let uniqueMemberIds: string[] = [];

    // space name validation
    if (!name) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Space name is required",
        statusCode: 400,
      });
    } else if (name.length > 100) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Space name should be less than or equal to 100 chars",
        statusCode: 400,
      });
    }

    if (description && description.length > 255) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Space description should be less than or equal to 255 chars",
        statusCode: 400,
      });
    }

    // space members validation
    if (members) {
      if (!Array.isArray(members) || !checkAllString(members)) {
        return res.status(400).send({
          success: false,
          data: {},
          message: "members value should be an array of _id(s)",
          statusCode: 400,
        });
      } else if (members.length > 0) {
        // check if each memberId is valid
        if (members.find((m) => !mongoose.isValidObjectId(m))) {
          return res.status(400).send({
            success: false,
            data: {},
            message: "Invalid member _id(s)",
            statusCode: 400,
          });
        }

        // extract unique values
        // remove the creator's _id
        uniqueMemberIds = getUniqueValues<string>(members).filter(
          (m) => m !== req.user._id.toString()
        );

        // remove empty strings from array
        uniqueMemberIds = uniqueMemberIds.filter((id) => id);
      }
    }

    // create a new Space
    const newSpace = new Space({
      name: validator.escape(name),
      creator: req.user._id,
    });

    // description
    if (description) {
      newSpace.description = validator.escape(description);
    }

    // space members
    if (uniqueMemberIds.length > 0) {
      // get all valid users
      const validMembers = await User.find({
        _id: { $in: uniqueMemberIds },
        emailVerified: true,
      }).select("_id");

      let valuesToInsert = validMembers.map((m) => {
        return {
          memberId: m,
          role: SPACE_MEMBER_ROLES.NORMAL,
        };
      });

      // insert valid values
      newSpace.members = valuesToInsert;
    }

    // add creator as ADMIN
    newSpace.members.push({
      memberId: req.user._id,
      role: SPACE_MEMBER_ROLES.ADMIN,
    });

    // save
    await newSpace.save();

    res.status(201).send({
      success: true,
      data: {
        _id: newSpace._id,
        name: newSpace.name,
        role: SPACE_MEMBER_ROLES.ADMIN,
        isFavorite: newSpace.isFavorite,
        icon: newSpace.icon,
        boards: [],
      },
      message: "Space created successfully",
      statusCode: 201,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      data: {},
      message: "Oops, something went wrong!",
      statusCode: 500,
    });
  }
};

// GET /spaces/mine -> get all spaces in which the user is either an admin/normal member
export const getSpacesMine = async (req: any, res: Response) => {
  try {
    const mySpaces = await Space.find({
      members: {
        $elemMatch: {
          memberId: req.user._id,
          role: {
            $in: [SPACE_MEMBER_ROLES.ADMIN, SPACE_MEMBER_ROLES.NORMAL],
          },
        },
      },
    }).select("_id name");

    res.send({
      success: true,
      data: mySpaces,
      message: "",
      statusCode: 200,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      data: {},
      message: "Oops, something went wrong!",
      statusCode: 500,
    });
  }
};

// GET /spaces/:id/info
export const getSpaceInfo = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "space _id is required",
        statusCode: 400,
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Invalid space _id",
        statusCode: 400,
      });
    }

    // to get a space's information, you must be a member in it
    const space = await Space.findOne({
      _id: id,
      members: {
        $elemMatch: {
          memberId: req.user._id,
        },
      },
    })
      .lean()
      .select("_id icon name members description");

    if (!space) {
      return res.status(404).send({
        success: false,
        data: {},
        message: "Space not found!",
        statusCode: 404,
      });
    }
    const favorite = await Favorite.findOne({
      resourceId: space._id,
      userId: req.user._id,
      type: SPACE,
    });

    res.send({
      success: true,
      data: {
        _id: space._id,
        icon: space.icon,
        name: space.name,
        role: space.members.find(
          (m: any) => m.memberId.toString() === req.user._id.toString()
        ).role,
        description: space.description,
        isFavorite: favorite ? true : false,
        favoriteId: favorite && favorite._id,
      },
      message: "",
      statusCode: 200,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      data: {},
      message: "Oops, something went wrong!",
      statusCode: 500,
    });
  }
};

// GET /spaces/:id/boards -> get all the boards under the space
export const getAllBoards = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "space _id is required",
        statusCode: 400,
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Invalid space _id",
        statusCode: 400,
      });
    }

    // to get a space's information, you must be a member in it
    const space = await Space.findOne({
      _id: id,
      members: {
        $elemMatch: {
          memberId: req.user._id,
        },
      },
    })
      .lean()
      .select("_id members boards")
      .populate({
        path: "boards",
        select: "_id name color bgImg members visibility createdAt",
      });

    if (!space) {
      return res.status(404).send({
        success: false,
        data: {},
        message: "Space not found!",
        statusCode: 404,
      });
    }

    let boards = [];

    // the user is able to see that space, so
    // find current user's role in this space role
    const role = space.members.find(
      (m: any) => m.memberId.toString() === req.user._id.toString()
    ).role;

    // split boards into two -> current user is actual member, not actual member
    const myBoards = space.boards.filter((board: any) =>
      board.members
        .map((m: any) => m.memberId.toString())
        .includes(req.user._id.toString())
    );
    // boards other than i am part of
    const notMyBoards = space.boards.filter(
      (board: any) =>
        !myBoards
          .map((b: any) => b._id.toString())
          .includes(board._id.toString())
    );

    // if current user is admin of space, show them all boards, board role determine -> take corresponding role from boards which he is member of + set isMember=true and for rest of the boards, give his role=ADMIN + set isMember=false
    if (role === SPACE_MEMBER_ROLES.ADMIN) {
      const totalBoards = [
        ...(await Promise.all(
          myBoards.map(async (b: any) => {
            const favorite = await Favorite.findOne({
              resourceId: b._id,
              userId: req.user._id,
              type: BOARD,
            });

            return {
              _id: b._id,
              name: b.name,
              isMember: true,
              color: b.color,
              bgImg: b.bgImg,
              visibility: b.visibility,
              isFavorite: favorite ? true : false,
              favoriteId: favorite && favorite._id,
              createdAt: b.createdAt,
              role: b.members.find(
                (board: any) =>
                  board.memberId.toString() === req.user._id.toString()
              ).role,
            };
          })
        )),
        ...(await Promise.all(
          notMyBoards.map(async (b: any) => {
            const favorite = await Favorite.findOne({
              resourceId: b._id,
              userId: req.user._id,
              type: BOARD,
            });

            return {
              _id: b._id,
              name: b.name,
              visibility: b.visibility,
              bgImg: b.bgImg,
              isFavorite: favorite ? true : false,
              favoriteId: favorite && favorite._id,
              createdAt: b.createdAt,
              isMember: false,
              color: b.color,
              role: BOARD_MEMBER_ROLES.ADMIN,
            };
          })
        )),
      ].sort(function (a: any, b: any) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return isEqual(b.createdAt, a.createdAt)
          ? 0
          : isAfter(b.createdAt, a.createdAt)
          ? -1
          : 1;
      });

      boards = totalBoards.map((b: any) => {
        delete b.createdAt;

        return b;
      });
    } else if (role === SPACE_MEMBER_ROLES.NORMAL) {
      // if current user is normal user in space, find all board which he is part of and take corresponding roles from them + set isMember = true, then take only public boards from otherBoards and set role=NORMAL + set isMember=false
      const totalBoards = [
        ...(await Promise.all(
          myBoards.map(async (b: any) => {
            const favorite = await Favorite.findOne({
              resourceId: b._id,
              userId: req.user._id,
              type: BOARD,
            });

            return {
              _id: b._id,
              name: b.name,
              isMember: true,
              visibility: b.visibility,
              bgImg: b.bgImg,
              isFavorite: favorite ? true : false,
              favoriteId: favorite && favorite._id,
              color: b.color,
              createdAt: b.createdAt,
              role: b.members.find(
                (board: any) =>
                  board.memberId.toString() === req.user._id.toString()
              ).role,
            };
          })
        )),
        ...(await Promise.all(
          notMyBoards
            .filter((b: any) => b.visibility === BOARD_VISIBILITY.PUBLIC)
            .map(async (b: any) => {
              const favorite = await Favorite.findOne({
                resourceId: b._id,
                userId: req.user._id,
                type: BOARD,
              });

              return {
                _id: b._id,
                name: b.name,
                isMember: false,
                visibility: b.visibility,
                bgImg: b.bgImg,
                createdAt: b.createdAt,
                isFavorite: favorite ? true : false,
                favoriteId: favorite && favorite._id,
                color: b.color,
                role: BOARD_MEMBER_ROLES.NORMAL,
              };
            })
        )),
      ].sort(function (a: any, b: any) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return isEqual(b.createdAt, a.createdAt)
          ? 0
          : isAfter(b.createdAt, a.createdAt)
          ? -1
          : 1;
      });

      boards = totalBoards.map((b: any) => {
        delete b.createdAt;

        return b;
      });
    } else if (role === SPACE_MEMBER_ROLES.GUEST) {
      // if current user is guest user in space, find all board which he is part of and take corresponding roles from them + set isMember = true, that's it
      const totalBoards = [
        ...(await Promise.all(
          myBoards.map(async (b: any) => {
            const favorite = await Favorite.findOne({
              resourceId: b._id,
              userId: req.user._id,
              type: BOARD,
            });

            return {
              _id: b._id,
              name: b.name,
              isMember: true,
              visibility: b.visibility,
              bgImg: b.bgImg,
              isFavorite: favorite ? true : false,
              favoriteId: favorite && favorite._id,
              createdAt: b.createdAt,
              color: b.color,
              role: b.members.find(
                (board: any) =>
                  board.memberId.toString() === req.user._id.toString()
              ).role,
            };
          })
        )),
      ].sort(function (a: any, b: any) {
        // Turn your strings into dates, and then subtract them
        // to get a value that is either negative, positive, or zero.
        return isEqual(b.createdAt, a.createdAt)
          ? 0
          : isAfter(b.createdAt, a.createdAt)
          ? -1
          : 1;
      });

      boards = totalBoards.map((b: any) => {
        delete b.createdAt;

        return b;
      });
    }

    res.send({
      success: true,
      data: boards,
      message: "",
      statusCode: 200,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      data: {},
      message: "Oops, something went wrong!",
      statusCode: 500,
    });
  }
};

// GET /spaces/:id/members -> get all space members
export const getAllSpaceMembers = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "space _id is required",
        statusCode: 400,
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Invalid space _id",
        statusCode: 400,
      });
    }

    // to get a space's information, you must be a member in it
    const space = await Space.findOne({
      _id: id,
      members: {
        $elemMatch: {
          memberId: req.user._id,
        },
      },
    })
      .lean()
      .select("_id members");

    if (!space) {
      return res.status(404).send({
        success: false,
        data: {},
        message: "Space not found!",
        statusCode: 404,
      });
    }

    // only give this information if current user is either an ADMIN or NORMAL
    const role = space.members.find(
      (m: any) => m.memberId.toString() === req.user._id.toString()
    ).role;

    // if he is a GUEST
    if (![SPACE_MEMBER_ROLES.ADMIN, SPACE_MEMBER_ROLES.NORMAL].includes(role)) {
      return res.status(403).send({
        success: false,
        data: {},
        message: "You don't have permission to access",
        statusCode: 403,
      });
    }

    const sortedMembers = space.members.sort(function (a: any, b: any) {
      // Turn your strings into dates, and then subtract them
      // to get a value that is either negative, positive, or zero.
      return isEqual(b.createdAt, a.createdAt)
        ? 0
        : isAfter(b.createdAt, a.createdAt)
        ? -1
        : 1;
    });

    const rearrangedMembers = [
      ...sortedMembers.filter((m: any) => m.role === SPACE_MEMBER_ROLES.ADMIN),
      ...sortedMembers.filter((m: any) => m.role === SPACE_MEMBER_ROLES.NORMAL),
      ...sortedMembers.filter((m: any) => m.role === SPACE_MEMBER_ROLES.GUEST),
    ];

    // if you reached this far, you may be an ADMIN or a NORMAL user
    res.send({
      success: true,
      data: rearrangedMembers,
      message: "",
      statusCode: 200,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      data: {},
      message: "Oops, something went wrong!",
      statusCode: 500,
    });
  }
};

// POST /spaces/:id/members -> to add a new member, only space admin can do this
export const addAMember = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { memberId } = req.body;

    if (!id) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "space _id is required",
        statusCode: 400,
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Invalid space _id",
        statusCode: 400,
      });
    }

    if (!memberId) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "memberId is required",
        statusCode: 400,
      });
    } else if (!mongoose.isValidObjectId(memberId)) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Invalid memberId",
        statusCode: 400,
      });
    }

    // now we have space _id & memberId
    // check if the space if valid + the current user is atleast a member in it
    const space = await Space.findOne({
      _id: id,
      members: {
        $elemMatch: {
          memberId: req.user._id,
        },
      },
    })
      .lean()
      .select("_id members");

    if (!space) {
      return res.status(404).send({
        success: false,
        data: {},
        message: "Space not found!",
        statusCode: 404,
      });
    }

    // to add a new member, space ADMIN can only do that
    const role = space.members.find(
      (m: any) => m.memberId.toString() === req.user._id.toString()
    ).role;

    if (role !== SPACE_MEMBER_ROLES.ADMIN) {
      return res.status(403).send({
        success: false,
        data: {},
        message: "You don't have permission to invite member(s)",
        statusCode: 403,
      });
    }

    // you are an ADMIN on this space
    // check the given memberId is valid
    // check the given memberId already exists
    const alreadyMember = space.members.find(
      (m: any) => m.memberId.toString() === memberId
    );

    if (alreadyMember && alreadyMember.role !== SPACE_MEMBER_ROLES.GUEST) {
      return res.status(409).send({
        success: false,
        data: {},
        message: "Member already a part of this space",
        statusCode: 409,
      });
    }

    // if he is already a guest user in this space, make him normal user
    if (alreadyMember && alreadyMember.role === SPACE_MEMBER_ROLES.GUEST) {
      // upgrade his role to NORMAL
      space.members = space.members.map((m: any) => {
        if (m.memberId.toString() === memberId) {
          return {
            ...m,
            role: SPACE_MEMBER_ROLES.NORMAL,
          };
        }

        return m;
      });

      await space.save();

      return res.send({
        success: true,
        data: {},
        message: "Member added to the space",
        statusCode: 200,
      });
    }

    // check if memberId is valid
    const member = await User.findOne({ _id: memberId });

    if (member) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "User with that memberId doesn't exists",
        statusCode: 400,
      });
    }

    // add that member to the space
    space.members.push({
      memberId: member._id,
      role: SPACE_MEMBER_ROLES.NORMAL,
    });

    await space.save();

    return res.send({
      success: true,
      data: {},
      message: "Member added to the space",
      statusCode: 200,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      data: {},
      message: "Oops, something went wrong!",
      statusCode: 500,
    });
  }
};

// PUT /spaces/:id/members/:memberId -> update the user role in this space
export const updateMemberRole = async (req: any, res: Response) => {
  try {
    const { id, memberId } = req.params;
    const { newRole } = req.body;

    if (!id) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "space _id is required",
        statusCode: 400,
      });
    } else if (!mongoose.isValidObjectId(id)) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Invalid space _id",
        statusCode: 400,
      });
    }

    if (!memberId) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "memberId is required",
        statusCode: 400,
      });
    } else if (!mongoose.isValidObjectId(memberId)) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "Invalid memberId",
        statusCode: 400,
      });
    }

    // validation for new role
    if (!newRole) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "newRole is required",
        statusCode: 400,
      });
    } else if (
      ![SPACE_MEMBER_ROLES.ADMIN, SPACE_MEMBER_ROLES.NORMAL].includes(newRole)
    ) {
      return res.status(400).send({
        success: false,
        data: {},
        message: "newRole should be either ADMIN or NORMAL",
        statusCode: 400,
      });
    }

    // now we have space _id & memberId & newRole
    // check if the space if valid + the current user is atleast a member in it
    const space = await Space.findOne({
      _id: id,
      members: {
        $elemMatch: {
          memberId: req.user._id,
        },
      },
    })
      .lean()
      .select("_id members boards");

    if (!space) {
      return res.status(404).send({
        success: false,
        data: {},
        message: "Space not found!",
        statusCode: 404,
      });
    }

    // to add a new member, space ADMIN can only do that
    const role = space.members.find(
      (m: any) => m.memberId.toString() === req.user._id.toString()
    ).role;

    if (role !== SPACE_MEMBER_ROLES.ADMIN) {
      return res.status(403).send({
        success: false,
        data: {},
        message: "You don't have permission to perform this action",
        statusCode: 403,
      });
    }

    // you reached here so you are an ADMIN
    // check if such a member exist in this space
    const targetMember = space.members.find(
      (m: any) => m.memberId.toString() === memberId
    );

    if (!targetMember) {
      // such a user doesn't exists in this space
      return res.status(400).send({
        success: false,
        data: {},
        message: "Such a member doesn't exists in this space",
        statusCode: 400,
      });
    }

    // such a member exists in this space, and you are the ADMIN also
    // that member which you are trying to change role can be either one of two persons -> the current user/you(ADMIN) or other user(ADMIN/NORMAL/GUEST)
    // we can consider GUEST user as well (flexible endpoint)

    // if you are trying to change your own role to something rather than ADMIN
    // and if you are the only ADMIN existing in the space -> block the OP
    if (
      req.user._id.toString() === targetMember.memberId.toString() &&
      newRole !== SPACE_MEMBER_ROLES.ADMIN &&
      space.members.filter((m: any) => m.role === SPACE_MEMBER_ROLES.ADMIN)
        .length === 1
    ) {
      return res.status(400).send({
        success: false,
        data: {},
        message:
          "You can’t change your role because there must be at least one admin.",
        statusCode: 400,
      });
    }

    // if you are now trying to change the the role of any user(including yours) to the same existing one
    if (newRole === targetMember.role) {
      return res.send({
        success: true,
        data: {},
        message: "The newRole is the already existing role. Nothing to change.",
        statusCode: 200,
      });
    }

    // 100% Operation allowed
    // possibles -> you are trying to change your own role/someone elses role to a "new role" which is either ADMIN/NORMAL
    // allow that
    space.members = space.members.map((m: any) => {
      if (m.memberId.toString() === targetMember.memberId.toString()) {
        return {
          ...m,
          role: [SPACE_MEMBER_ROLES.ADMIN, SPACE_MEMBER_ROLES.NORMAL].find(
            (r: any) => r === newRole
          ),
        };
      }

      return m;
    });

    await space.save();

    // if newRole === ADMIN, change all board role in which current user is member in this space to ADMIN

    // find all boards in this space in which the targetMember is member of
    const boards = await Board.find({
      _id: { $in: space.boards },
      members: {
        $elemMatch: {
          memberId: targetMember.memberId,
        },
      },
    }).select("_id members");

    // upgrade -> to ADMIN
    if (newRole === SPACE_MEMBER_ROLES.ADMIN) {
      await boards.map(async (b: any) => {
        b.members = b.members.map((m: any) => {
          if (m.memberId === targetMember.memberId) {
            return {
              ...m,
              role: BOARD_MEMBER_ROLES.ADMIN,
            };
          }
          return m;
        });

        await b.save();
      });
    } else if (
      newRole === SPACE_MEMBER_ROLES.NORMAL &&
      targetMember.role !== SPACE_MEMBER_ROLES.GUEST
    ) {
      // downgrade from ADMIN to NORMAL
      // update this user's board role in every board he is member of to the fallbackRole and save
      await boards.map(async (b: any) => {
        b.members = b.members.map((m: any) => {
          if (m.memberId === targetMember.memberId) {
            return {
              ...m,
              role: m.fallbackRole,
            };
          }
          return m;
        });

        await b.save();
      });
    }

    return res.send({
      success: true,
      data: {},
      message: "Role updated successfully.",
      statusCode: 200,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      data: {},
      message: "Oops, something went wrong!",
      statusCode: 500,
    });
  }
};
