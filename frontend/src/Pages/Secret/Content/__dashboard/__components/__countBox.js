import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchProducts } from "../../../../../features/business/product/productSlice";
import { fetchUsers } from "../../../../../features/users/userSlice";
import { ProfileHeader } from "./__profile/__profileHeader";

export const CountBox = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchUsers({ page: 1, perPage: 10 }))
      .unwrap()
      .catch((error) => console.error("Failed to fetch datas:", error));
    dispatch(fetchProducts({ page: 1, perPage: 10 }))
      .unwrap()
      .catch((error) => console.error("Failed to fetch datas:", error));
  }, [dispatch]);
  return (
    <>
      <>
        <ProfileHeader />
        <div className="divider divider-info">Dashboard</div>
      </>
    </>
  );
};
