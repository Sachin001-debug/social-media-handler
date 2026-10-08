import React, { useEffect, useState }  from "react";
import { authApi } from "../api/client";

const Dashboard = () => {
  const [user, setUser] = useState("");

  const fetchUser = async () => {
    try {
      const res = await authApi.me();

      if (res?.user) {
        setUser(res.user.name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div>
      <h1 className="text-xl">Welcome <span className="font-semibold text-2xl">{user},</span></h1>
      <p className="text-gray-500">Manage your users account(s) from here. Social media handling never got easier than this.</p>
    </div>
  );
};

export default Dashboard;