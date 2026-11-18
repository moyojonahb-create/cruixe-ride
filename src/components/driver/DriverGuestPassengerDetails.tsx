export default function DriverGuestPassengerDetails({ name, phone }: { name: string; phone?: string | null }) {
  const normalized = phone?.trim().replace(/[\s().-]/g, '');
  const contact = normalized && /^\+?\d{7,15}$/.test(normalized) ? normalized : null;
  const card = 'rounded-[15px] border border-[#e4e7ed] px-[13px] py-2.5';
  const label = 'text-[12px] font-semibold';
  const action = 'flex min-h-11 items-center justify-center rounded-[13px] px-2 text-center font-semibold text-white';

  return (
    <section aria-labelledby="guest-passenger-title" className="space-y-[14px] pb-3 text-[#1c2430]">
      <header className="pb-2">
        <h1 id="guest-passenger-title" className="text-[21px] font-semibold">Booking for someone else</h1>
        <p className="mt-1 text-[11px] text-[#667382]">Meet the passenger named below.</p>
      </header>
      <div className={`${card} min-h-[108px] bg-[#f4f6f8]`}>
        <h2 className={label}>PASSENGER TO PICK UP</h2>
        <p className="mt-3 break-words text-[11px] text-[#667382]">{name}</p>
        <p className="mt-3 break-words text-[11px] font-semibold">{contact ? `Contact: ${phone}` : 'Passenger contact unavailable'}</p>
      </div>
      <div className={`${card} min-h-[108px] bg-white`}>
        <h2 className={label}>BOOKING MADE BY</h2>
        <p className="mt-3 text-[11px] text-[#667382]">Another CruiXe account holder</p>
        <p className="mt-3 text-[11px]">The account holder booked this trip for the passenger above.</p>
      </div>
      <div className={`${card} min-h-[132px] bg-[#f4f6f8]`}>
        <h2 className={label}>PICKUP VERIFICATION</h2>
        <p className="mt-3 text-[11px] text-[#667382]">Confirm the passenger’s full name at pickup.</p>
        {contact && (
          <div className="mt-5 grid grid-cols-2 gap-1">
            <a className={`${action} bg-[#ff000d] text-[14px]`} href={`tel:${contact}`}>Call passenger</a>
            <a className={`${action} bg-[#1f2129] text-[11px]`} href={`sms:${contact}`}>Message passenger</a>
          </div>
        )}
      </div>
    </section>
  );
}
