import { Link2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import React, { useState } from "react";

const Whatsapp = () => {
  const [formToggled, setFormToggled] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <div
          onClick={() => setFormToggled((prev) => !prev)}
          className="group relative flex items-center gap-2 px-5 py-2 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer bg-gradient-to-br from-[#128C7E] to-[#25D366] hover:from-[#0F7A6E] hover:to-[#20BD5A]"
        >
          <Link2
            size={18}
            className="transition-transform duration-200 group-hover:rotate-12"
          />
          Connect
        </div>
      </div>

      {formToggled && (
        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-lg ring-1 ring-black/5 p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-white bg-gradient-to-br from-[#128C7E] to-[#25D366]">
                <FaWhatsapp size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">
                  Connect to WhatsApp
                </h3>
                <p className="text-xs text-gray-500">
                  Link your account to continue
                </p>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Connecting to WhatsApp...");
                setFormToggled(false);
              }}
              className="space-y-3"
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg text-white font-semibold py-2.5 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md bg-gradient-to-br from-[#128C7E] to-[#25D366] hover:from-[#0F7A6E] hover:to-[#20BD5A]"
              >
                <FaWhatsapp size={16} />
                Connect with WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setFormToggled(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Whatsapp;