import { useState } from "react";
import { FaFacebookF } from "react-icons/fa";
import { facebookApi } from "../api/client";

const FacebookPageAvatar = ({ account, className }) => {
  const [failed, setFailed] = useState(false);

  if (!account || failed) {
    return (
      <div
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white ${className}`}
      >
        {account?.name?.charAt(0)?.toUpperCase() || <FaFacebookF size={16} />}
      </div>
    );
  }

  return (
    <img
      src={facebookApi.pictureUrl(account.id)}
      alt={account.name || "Facebook Page"}
      className={`shrink-0 rounded-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
};

export default FacebookPageAvatar;
