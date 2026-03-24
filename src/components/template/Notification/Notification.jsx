'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NotificationAvatar from './NotificationAvatar'
import NotificationToggle from './NotificationToggle'
import { HiOutlineMailOpen } from 'react-icons/hi'
import {
    apiGetNotificationList,
    apiGetNotificationCount,
    apiMarkNotificationAsRead,
    apiMarkAllNotificationsAsRead,
} from '@/services/CommonService'
import isLastChild from '@/utils/isLastChild'
import useResponsive from '@/utils/hooks/useResponsive'
import { useRouter } from 'next/navigation'

const notificationHeight = 'h-[280px]'
const POLL_INTERVAL = 15000 // 15 seconds

/** Play an Apple-style tri-tone notification chime using Web Audio API */
const playNotificationSound = () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const notes = [880, 1046.5, 1318.5] // A5, C6, E6 — major triad
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12)
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.12 + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(ctx.currentTime + i * 0.12)
            osc.stop(ctx.currentTime + i * 0.12 + 0.25)
        })
        setTimeout(() => ctx.close(), 1000)
    } catch (e) {
        // Audio not available — silent fallback
    }
}

const _Notification = ({ className }) => {
    const [notificationList, setNotificationList] = useState([])
    const [unreadNotification, setUnreadNotification] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [noResult, setNoResult] = useState(false)
    const [loading, setLoading] = useState(false)
    const prevCountRef = useRef(0)

    const { larger } = useResponsive()

    const router = useRouter()

    const getNotificationCount = useCallback(async () => {
        try {
            const resp = await apiGetNotificationCount()
            const count = resp.count || 0
            if (count > 0) {
                setNoResult(false)
                setUnreadNotification(true)
                setUnreadCount(count)
                // Play sound only when count increases (new notification arrived)
                if (count > prevCountRef.current && prevCountRef.current !== -1) {
                    playNotificationSound()
                }
            } else {
                setNoResult(true)
                setUnreadNotification(false)
                setUnreadCount(0)
            }
            prevCountRef.current = count
        } catch (e) {
            // silent
        }
    }, [])

    useEffect(() => {
        // Mark initial as -1 so first load doesn't play sound
        prevCountRef.current = -1
        getNotificationCount().then(() => {
            // After first fetch, set the real count so future polls can compare
            // prevCountRef is already set inside getNotificationCount
        })
        const interval = setInterval(getNotificationCount, POLL_INTERVAL)
        return () => clearInterval(interval)
    }, [getNotificationCount])

    const onNotificationOpen = async () => {
        if (notificationList.length === 0) {
            setLoading(true)
            const resp = await apiGetNotificationList()
            setLoading(false)
            setNotificationList(resp)
        }
    }

    const onMarkAllAsRead = async () => {
        const list = notificationList.map((item) => ({
            ...item,
            readed: true,
        }))
        setNotificationList(list)
        setUnreadNotification(false)
        setUnreadCount(0)
        prevCountRef.current = 0
        try {
            await apiMarkAllNotificationsAsRead()
        } catch (e) {
            console.error('Failed to mark all as read:', e)
        }
    }

    const notificationDropdownRef = useRef(null)

    const onMarkAsRead = async (item) => {
        const list = notificationList.map((n) =>
            n.id === item.id ? { ...n, readed: true } : n
        )
        setNotificationList(list)
        const remaining = list.filter((n) => !n.readed).length
        setUnreadCount(remaining)
        prevCountRef.current = remaining
        if (remaining === 0) {
            setUnreadNotification(false)
        }
        try {
            await apiMarkNotificationAsRead(item.id)
        } catch (e) {
            console.error('Failed to mark as read:', e)
        }
        // Navigate to linked page
        if (item.link) {
            if (notificationDropdownRef.current) {
                notificationDropdownRef.current.handleDropdownClose()
            }
            router.push(item.link)
        }
    }

    const handleViewAllActivity = () => {
        router.push('/concepts/account/activity-log')
        if (notificationDropdownRef.current) {
            notificationDropdownRef.current.handleDropdownClose()
        }
    }

    return (
        <Dropdown
            ref={notificationDropdownRef}
            renderTitle={
                <NotificationToggle
                    dot={unreadNotification}
                    className={className}
                    count={unreadCount}
                />
            }
            menuClass="min-w-[280px] md:min-w-[340px]"
            placement={larger.md ? 'bottom-end' : 'bottom'}
            onOpen={onNotificationOpen}
        >
            <Dropdown.Item variant="header">
                <div className="dark:border-gray-700 px-2 flex items-center justify-between mb-1">
                    <h6>Notifications</h6>
                    <Button
                        variant="plain"
                        shape="circle"
                        size="sm"
                        icon={<HiOutlineMailOpen className="text-xl" />}
                        title="Mark all as read"
                        onClick={onMarkAllAsRead}
                    />
                </div>
            </Dropdown.Item>
            <ScrollBar
                className={classNames('overflow-y-auto', notificationHeight)}
            >
                {notificationList.length > 0 &&
                    notificationList.map((item, index) => (
                        <div key={item.id}>
                            <div
                                className={`relative rounded-xl flex px-4 py-3 cursor-pointer hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-gray-700`}
                                onClick={() => onMarkAsRead(item)}
                            >
                                <div>
                                    <NotificationAvatar {...item} />
                                </div>
                                <div className="mx-3">
                                    <div>
                                        {item.target && (
                                            <span className="font-semibold heading-text">
                                                {item.target}{' '}
                                            </span>
                                        )}
                                        <span>{item.description}</span>
                                    </div>
                                    <span className="text-xs">{item.date}</span>
                                </div>
                                <Badge
                                    className="absolute top-4 ltr:right-4 rtl:left-4 mt-1.5"
                                    innerClass={`${
                                        item.readed
                                            ? 'bg-gray-300 dark:bg-gray-600'
                                            : 'bg-primary'
                                    } `}
                                />
                            </div>
                            {!isLastChild(notificationList, index) ? (
                                <div className="border-b border-gray-200 dark:border-gray-700 my-2" />
                            ) : (
                                ''
                            )}
                        </div>
                    ))}
                {loading && (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <Spinner size={40} />
                    </div>
                )}
                {noResult && notificationList.length === 0 && (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <div className="text-center">
                            <img
                                className="mx-auto mb-2 max-w-[150px]"
                                src="/img/others/no-notification.png"
                                alt="no-notification"
                            />
                            <h6 className="font-semibold">No notifications!</h6>
                            <p className="mt-1">Please Try again later</p>
                        </div>
                    </div>
                )}
            </ScrollBar>
            <Dropdown.Item variant="header">
                <div className="pt-4">
                    <Button
                        block
                        variant="solid"
                        onClick={handleViewAllActivity}
                    >
                        View All Activity
                    </Button>
                </div>
            </Dropdown.Item>
        </Dropdown>
    )
}

const Notification = withHeaderItem(_Notification)

export default Notification
