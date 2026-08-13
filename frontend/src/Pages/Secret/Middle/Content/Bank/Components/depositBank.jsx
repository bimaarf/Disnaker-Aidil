import React from "react";
import { Bank } from "../bank";
import { DepositBankForm } from "./_depositBankForm";
import { useSelector } from "react-redux";

export const DepositBank = () => {
  const theme = useSelector((state) => state.themes.theme);
  return (
    <Bank>
      <div className={`bg-${theme?.name}-950/0 md:p-6`}>
        <DepositBankForm />
      </div>
    </Bank>
  );
};
