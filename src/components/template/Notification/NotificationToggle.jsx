import classNames from '@/utils/classNames'
import Badge from '@/components/ui/Badge'
import { PiBellDuotone } from 'react-icons/pi'

const NotificationToggle = ({ className, dot, count }) => {
    return (
        <div className={classNames('text-2xl relative', className)}>
            {dot ? (
                <>
                    <PiBellDuotone />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none px-1">
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                </>
            ) : (
                <PiBellDuotone />
            )}
        </div>
    )
}

export default NotificationToggle
