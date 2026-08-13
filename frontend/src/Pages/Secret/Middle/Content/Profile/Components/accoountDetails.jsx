import React from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../../features/authentication/AuthSlice";
import { Profile } from "../profile";
import { InputContactInformation } from "./_inputContactInformation";
import { InputPersonalInformation } from "./_inputPersonalInformation";

export const AccountDetails = () => {
  const currentUser = useSelector(selectUser);
  const theme = useSelector((state) => state.themes.theme);
  return (
    <Profile>
      <div className={`bg-${theme?.name}-950/10 md:p-4`}>
        <div className="mt-4">
          <div className="p-3 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
            <h1>Profil Saya</h1>
          </div>
          <div className="p-3 font-body">
            <div className="p-3">
              <div className="p-3 mb-4 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
                <h1>Informasi Pribadi</h1>
              </div>
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
              <InputPersonalInformation currentUser={currentUser} />
            </div>
            <div className="p-3">
              <div className="p-3 mb-4 bg-gradient-to-t from-yellow-700 to-yellow-500 text-white text-sm uppercase">
                <h1>Informasi Kontak</h1>
              </div>
              <InputContactInformation currentUser={currentUser} />
            </div>
          </div>
        </div>
      </div>
    </Profile>
  );
};
