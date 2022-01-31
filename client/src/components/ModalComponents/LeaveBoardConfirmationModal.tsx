import { AxiosError } from "axios";
import React, { useCallback } from "react";
import { useQueryClient } from "react-query";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../axiosInstance";
import { hideModal } from "../../redux/features/modalSlice";
import { addToast } from "../../redux/features/toastSlice";
import { ERROR, SUCCESS } from "../../types/constants";

interface Props {
  spaceId: string;
}

const LeaveBoardConfirmationModal = ({ spaceId }: Props) => {
  const dispatch = useDispatch();

  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const leaveFromSpace = useCallback((spaceId) => {
    dispatch(hideModal());

    axiosInstance
      .delete(`/spaces/${spaceId}/members`)
      .then((response) => {
        const { message } = response.data;

        dispatch(
          addToast({
            kind: SUCCESS,
            msg: message,
          })
        );

        queryClient.invalidateQueries(["getSpaces"]);
        queryClient.invalidateQueries(["getFavorites"]);
        queryClient.invalidateQueries(["getSpaceInfo", spaceId]);
        queryClient.invalidateQueries(["getSpaceMembers", spaceId]);

        navigate("/", { replace: true });
      })
      .catch((error: AxiosError) => {
        if (error.response) {
          const response = error.response;
          const { message } = response.data;

          switch (response.status) {
            case 404:
              dispatch(addToast({ kind: ERROR, msg: message }));
              queryClient.invalidateQueries(["getSpaces"]);
              queryClient.invalidateQueries(["getFavorites"]);
              // redirect them to home page
              navigate("/", { replace: true });
              break;
            case 400:
            case 403:
            case 500:
              dispatch(addToast({ kind: ERROR, msg: message }));
              break;
            default:
              dispatch(
                addToast({ kind: ERROR, msg: "Oops, something went wrong" })
              );
              break;
          }
        } else if (error.request) {
          dispatch(
            addToast({ kind: ERROR, msg: "Oops, something went wrong" })
          );
        } else {
          dispatch(addToast({ kind: ERROR, msg: `Error: ${error.message}` }));
        }
      });
  }, []);

  return (
    <div
      className="leave-space-confirmation-modal"
      style={{
        width: "450px",
      }}
    >
      <p className="px-4 py-2">
        You will be removed from all the cards on this board.
      </p>
      <div className="buttons py-2 pb-3 flex justify-end">
        <button
          onClick={() => dispatch(hideModal())}
          className="font-medium text-slate-600 mr-4"
        >
          Cancel
        </button>
        <button onClick={() => leaveFromSpace(spaceId)} className="btn-danger">
          Leave
        </button>
      </div>
    </div>
  );
};

export default LeaveBoardConfirmationModal;