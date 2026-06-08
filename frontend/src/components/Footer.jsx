import { IconPhoneCall } from '@tabler/icons-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-12 py-6 flex items-center justify-between gap-4">
      <p className="text-[12px] text-grey-400 max-w-[420px] leading-relaxed">
        <strong className="text-white">LifeRoute AI</strong> provides real-time
        hospital data for informational purposes. Always call 112 in
        life-threatening emergencies. Data refreshed every 30 seconds.
      </p>
      <div className="flex items-center gap-2.5 bg-red-brand/[0.08] border border-red-brand/20 rounded-[10px] px-[18px] py-2.5 text-[13px] font-semibold text-[#FF6B7A] cursor-pointer">
        <IconPhoneCall size={16} stroke={1.5} />
        Emergency: 112
      </div>
    </footer>
  )
}
