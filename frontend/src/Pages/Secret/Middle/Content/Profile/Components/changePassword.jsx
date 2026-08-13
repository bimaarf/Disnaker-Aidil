import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../features/authentication/AuthSlice";
import { Profile } from "../profile";
import { InputChangePassword } from "./_inputChangePassword";

export const ChangePassword = () => {
  const currentUser = useSelector(selectUser);
  const theme = useSelector((state) => state.themes.theme);
  return (
    <Profile>
      <div className={`bg-${theme?.name}-950/10 md:p-4`}>
        <div className="mt-4">
          <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
            <h1>UBAH KATA SANDI</h1>
          </div>
          <div className="p-3 font-body">
            <div className="p-3 text-xs rounded text-white bg-neutral-500/40">
              <p className="text-yellow-500">Catatan</p>
              <li className="list-decimal">
                Kata Sandi harus terdiri dari 8-20 karakter.
              </li>
              <li className="list-decimal">
                Kata Sandi harus mengandung huruf dan angka.
              </li>
              <li className="list-decimal">
                Kata Sandi tidak boleh mengandung username.
              </li>
            </div>
            <InputChangePassword currentUser={currentUser} />
          </div>
        </div>
      </div>
    </Profile>
  );
};
