import React from "react";

export default function Navbar() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-muted/20 pb-4 mb-8">
      {/* Logo + brand */}
      <div className="flex items-center gap-4 text-text-main">
        <div className="size-6 text-primary">
          <svg
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] font-display">
          Narrative Journey
        </h2>
      </div>

      {/* Avatar */}
      <div className="flex flex-1 justify-end gap-8">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-muted/20"
          aria-label="User avatar"
          style={{
            backgroundImage:
              'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDHweyw1eBb0BO5Ud1jby0UzX61SmlCbPJdQrSbk1vMIypuwrSUCLzpB5IAP0g4KkYdUjNckKrbve5ybsQASlnPU4Tt-ASuoHENdrGpUr3szhKfPyN43m3Dvg_OEutOBfE6Bl_0hmUXQ_DgiqXTa5cpp73wDRyrysxiErLJ3gwzyfA_WAO2cP9yB52-FrqYF8BzOMLiBLvWNzDlzBpfDyj2LhF5XR8IPYeaQTb0jT8fA4XU4SZwtOyLgHGc20OqAi_D3Zr0dGR48SU")',
          }}
        />
      </div>
    </header>
  );
}
