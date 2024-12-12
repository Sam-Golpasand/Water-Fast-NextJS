import React from 'react';

export default function FloatingLabelInput({value, onChange, label, id}: any ) {
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={id}
        required
        value={value}
        onChange={onChange}
        className="block w-full rounded-xl bg-[#282831] text-foreground px-3 py-4 shadow-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        focus:shadow-[0_0_15px_rgba(59,130,246,0.5)]
        transition-all duration-300 peer"
        placeholder=" "
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-3 text-sm text-muted-foreground px-1 
        transition-all duration-200 transform -translate-y-1/2 scale-90 
        peer-placeholder-shown:top-4 peer-placeholder-shown:text-muted-foreground peer-placeholder-shown:scale-100 
        peer-placeholder-shown:translate-y-0
        peer-focus:top-2 peer-focus:scale-90 peer-focus:text-blue-500"
      >
        {label}
      </label>
    </div>
  );
};