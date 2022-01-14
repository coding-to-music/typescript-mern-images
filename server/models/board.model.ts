import mongoose from "mongoose";
import validator from "validator";
import { BOARD_MEMBER_ROLES, BOARD_VISIBILITY } from "../types/constants";

const boardMemberSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(BOARD_MEMBER_ROLES),
    default: BOARD_MEMBER_ROLES.NORMAL,
  },
  adminGrantedRole: {
    type: String,
    enum: [...Object.values(BOARD_MEMBER_ROLES), null],
    default: null,
  },
});

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 512,
    },
    visibility: {
      type: String,
      enum: Object.values(BOARD_VISIBILITY),
      default: BOARD_VISIBILITY.PUBLIC,
    },
    bgImg: {
      type: String,
      required: false,
      validate: {
        validator: function (value: string) {
          return validator.isURL(value, {
            require_protocol: true
          });
        },
        message: `Invalid Image URL`,
      },
    },
    color: {
      type: String,
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    lists: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "List",
          required: true,
        },
      ],
      default: [],
    },
    members: {
      type: [boardMemberSchema],
      default: [],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Board = mongoose.model("Board", boardSchema);

export default Board;