import React from "react";
import ProfileCard from "./ProfileCard";
import { HiOutlineMenu } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { showSidebar } from "../../redux/features/sidebarSlice";
import { RootState } from "../../redux/app";

const Header = () => {
  const dispatch = useDispatch();

  const { show } = useSelector((state: RootState) => state.sidebar);

  return (
    <header className="header h-14 bg-white flex items-center justify-between px-4">
      <div className="left flex items-center justify-start">
        {!show && (
          <button className="hover:text-violet-500" onClick={() => dispatch(showSidebar())}>
            <HiOutlineMenu size={20} />
          </button>
        )}
      </div>
      <div className="right">
        <ProfileCard />
      </div>
    </header>
  );
};

export default Header;
