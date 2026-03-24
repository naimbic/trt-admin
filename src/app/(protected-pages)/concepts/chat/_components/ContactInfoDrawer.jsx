'use client'
import { useEffect, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import CloseButton from '@/components/ui/CloseButton'
import Dialog from '@/components/ui/Dialog'
import Drawer from '@/components/ui/Drawer'
import ScrollBar from '@/components/ui/ScrollBar'
import Tabs from '@/components/ui/Tabs'
import ImageGallery from '@/components/shared/ImageGallery'
import FileIcon from '@/components/view/FileIcon'
import fileSizeUnit from '@/utils/fileSizeUnit'
import { useChatStore } from '../_store/chatStore'
import { apiGetContactDetails, apiGetContacts } from '@/services/ChatService'
import useSWRMutation from 'swr/mutation'
import isEmpty from 'lodash/isEmpty'
import dayjs from 'dayjs'
import {
    TbMail,
    TbPhone,
    TbClock,
    TbDownload,
    TbExternalLink,
    TbUserPlus,
    TbX,
    TbCheck,
    TbSearch,
} from 'react-icons/tb'

const { TabNav, TabList, TabContent } = Tabs

const ContactInfoField = ({ title, value, icon }) => {
    return (
        <div className="flex items-center gap-4">
            <div className="text-2xl">{icon}</div>
            <div>
                <small className="font-semibold">{title}</small>
                <p className="heading-text font-semibold">{value}</p>
            </div>
        </div>
    )
}

const ContactInfoDrawer = () => {
    const contactInfoDrawer = useChatStore((state) => state.contactInfoDrawer)
    const setContactInfoDrawer = useChatStore(
        (state) => state.setContactInfoDrawer,
    )

    const [imageGalleryIndex, setImageGalleryIndex] = useState(-1)
    const [addMemberDialog, setAddMemberDialog] = useState(false)
    const [availableContacts, setAvailableContacts] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedToAdd, setSelectedToAdd] = useState([])

    const { trigger, data } = useSWRMutation(
        [`/api/chats/contact/${contactInfoDrawer.userId}`, contactInfoDrawer],
        // eslint-disable-next-line no-unused-vars
        ([_, params]) =>
            apiGetContactDetails({
                id: params.userId,
            }),
    )

    const handleDrawerClose = () => {
        setContactInfoDrawer({
            userId: '',
            chatId: '',
            chatType: '',
            open: false,
        })
    }

    const handleRemoveMember = async (memberId) => {
        try {
            await fetch(`/api/chat/${contactInfoDrawer.chatId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ removeMembers: [memberId] }),
            })
            trigger() // refresh data
        } catch (err) {
            console.error('Failed to remove member:', err)
        }
    }

    const handleOpenAddMember = async () => {
        setAddMemberDialog(true)
        try {
            const contacts = await apiGetContacts()
            // Filter out existing members
            const memberIds = new Set(data?.userDetails?.members?.map((m) => m.id) || [])
            setAvailableContacts(contacts.filter((c) => !memberIds.has(c.id)))
        } catch (err) {
            console.error('Failed to load contacts:', err)
        }
    }

    const handleAddMembers = async () => {
        if (selectedToAdd.length === 0) return
        try {
            await fetch(`/api/chat/${contactInfoDrawer.chatId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ addMembers: selectedToAdd.map((c) => c.id) }),
            })
            trigger() // refresh data
        } catch (err) {
            console.error('Failed to add members:', err)
        }
        setAddMemberDialog(false)
        setSelectedToAdd([])
        setSearchQuery('')
    }

    const filteredContacts = availableContacts.filter((c) =>
        !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    useEffect(() => {
        if (contactInfoDrawer.userId) {
            trigger()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contactInfoDrawer.userId])

    const images = data?.media?.images || []
    const files = data?.media?.files || []
    const links = data?.media?.links || []

    return (
        <>
        <Drawer
            title={null}
            closable={false}
            isOpen={contactInfoDrawer.open}
            showBackdrop={false}
            width={400}
            onClose={handleDrawerClose}
            onRequestClose={handleDrawerClose}
        >
            <div className="flex justify-end">
                <CloseButton onClick={handleDrawerClose} />
            </div>
            {!isEmpty(data?.userDetails) && (
                <ScrollBar className="h-[calc(100%-30px)]">
                    <div className="mt-10 flex justify-center">
                        <Avatar src={data?.userDetails.img} size={90} />
                    </div>
                    <div className="mt-4 text-center">
                        <h5 className="font-bold">{data?.userDetails.name}</h5>
                        <span className="mt-1">
                            {contactInfoDrawer.chatType === 'personal'
                                ? data?.userDetails.title
                                : `Groups • ${data?.userDetails?.members?.length} members`}
                        </span>
                    </div>
                    <div className="flex flex-col gap-y-7 mt-8">
                        {contactInfoDrawer.chatType === 'personal' ? (
                            <>
                                <ContactInfoField
                                    title="Email"
                                    value={data.userDetails.email}
                                    icon={<TbMail />}
                                />
                                <ContactInfoField
                                    title="Phone"
                                    value={
                                        data.userDetails?.personalInfo
                                            ?.phoneNumber || 'N/A'
                                    }
                                    icon={<TbPhone />}
                                />
                                <ContactInfoField
                                    title="Last Online"
                                    value={dayjs
                                        .unix(data.userDetails.lastOnline)
                                        .format('DD MMM YYYY hh:mm A')}
                                    icon={<TbClock />}
                                />
                            </>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="heading-text font-semibold">
                                        Members
                                    </div>
                                    <Button
                                        size="xs"
                                        variant="plain"
                                        icon={<TbUserPlus />}
                                        onClick={handleOpenAddMember}
                                    >
                                        Add
                                    </Button>
                                </div>
                                {data?.userDetails?.members?.map(
                                    (member) => (
                                        <div
                                            key={member.id}
                                            className="rounded-xl py-3 flex items-center justify-between gap-2 group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Avatar src={member.img} size={32} />
                                                <div>
                                                    <div className="font-bold heading-text text-sm">
                                                        {member.name}
                                                    </div>
                                                    <span className="text-xs">
                                                        {member.email}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                                title="Remove member"
                                                onClick={() => handleRemoveMember(member.id)}
                                            >
                                                <TbX className="text-base" />
                                            </button>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                    <div className="mt-8">
                        <Tabs defaultValue="media">
                            <TabList>
                                <TabNav value="media" className="flex-1">
                                    Media {images.length > 0 && `(${images.length})`}
                                </TabNav>
                                <TabNav value="files" className="flex-1">
                                    Files {files.length > 0 && `(${files.length})`}
                                </TabNav>
                                <TabNav value="links" className="flex-1">
                                    Links {links.length > 0 && `(${links.length})`}
                                </TabNav>
                            </TabList>
                            <div className="py-4">
                                <TabContent value="media">
                                    {images.length > 0 ? (
                                        <ImageGallery
                                            index={imageGalleryIndex}
                                            slides={images.map((img) => ({ src: img.url }))}
                                            onClose={() => setImageGalleryIndex(-1)}
                                        >
                                            <div className="grid grid-cols-3 gap-2">
                                                {images.map((img, index) => (
                                                    <div
                                                        key={img.id}
                                                        className="cursor-pointer"
                                                        role="button"
                                                        onClick={() => setImageGalleryIndex(index)}
                                                    >
                                                        <img
                                                            className="rounded-xl aspect-square object-cover"
                                                            src={img.url}
                                                            alt=""
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </ImageGallery>
                                    ) : (
                                        <p className="text-center text-gray-400 py-4">No media shared yet</p>
                                    )}
                                </TabContent>
                                <TabContent value="files">
                                    {files.length > 0 ? files.map((file) => (
                                        <div
                                            key={file.id}
                                            className="rounded-xl py-3 flex items-center justify-between gap-2 group"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="text-3xl">
                                                    <FileIcon type={file.fileType} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold heading-text text-sm truncate">
                                                        {file.name}
                                                    </div>
                                                    <span className="text-xs">
                                                        {fileSizeUnit(file.size || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {file.url && (
                                                    <>
                                                        <a
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Open"
                                                        >
                                                            <TbExternalLink className="text-base" />
                                                        </a>
                                                        <a
                                                            href={file.url}
                                                            download={file.name}
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Download"
                                                        >
                                                            <TbDownload className="text-base" />
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-center text-gray-400 py-4">No files shared yet</p>
                                    )}
                                </TabContent>
                                <TabContent value="links">
                                    {links.length > 0 ? links.map((link) => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            className="rounded-xl py-3 px-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 no-underline"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Avatar
                                                src={link.favicon}
                                                size={28}
                                                className="bg-transparent"
                                            />
                                            <div className="min-w-0">
                                                <div className="font-bold heading-text text-sm truncate">
                                                    {link.title}
                                                </div>
                                                <div className="text-xs truncate text-gray-500">
                                                    {link.description}
                                                </div>
                                            </div>
                                        </a>
                                    )) : (
                                        <p className="text-center text-gray-400 py-4">No links shared yet</p>
                                    )}
                                </TabContent>
                            </div>
                        </Tabs>
                    </div>
                </ScrollBar>
            )}
        </Drawer>

        {/* Add Member Dialog */}
        <Dialog
            isOpen={addMemberDialog}
            onClose={() => { setAddMemberDialog(false); setSelectedToAdd([]); setSearchQuery('') }}
            onRequestClose={() => { setAddMemberDialog(false); setSelectedToAdd([]); setSearchQuery('') }}
        >
            <h5 className="mb-4">Add Members</h5>
            <div className="relative mb-4">
                <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent focus:outline-none focus:border-primary text-sm"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <ScrollBar className="max-h-[300px] overflow-y-auto">
                <div className="flex flex-col gap-1">
                    {filteredContacts.map((contact) => {
                        const isSelected = selectedToAdd.some((c) => c.id === contact.id)
                        return (
                            <div
                                key={contact.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                                onClick={() => {
                                    setSelectedToAdd((prev) =>
                                        isSelected
                                            ? prev.filter((c) => c.id !== contact.id)
                                            : [...prev, contact],
                                    )
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Avatar src={contact.img} size={32} />
                                    <div>
                                        <div className="font-bold heading-text text-sm">{contact.name}</div>
                                        <div className="text-xs">{contact.email}</div>
                                    </div>
                                </div>
                                {isSelected && <TbCheck className="text-xl text-primary" />}
                            </div>
                        )
                    })}
                    {filteredContacts.length === 0 && (
                        <p className="text-center text-gray-400 py-4">No contacts available</p>
                    )}
                </div>
            </ScrollBar>
            <div className="mt-4 flex justify-end gap-2">
                <Button variant="plain" onClick={() => { setAddMemberDialog(false); setSelectedToAdd([]); setSearchQuery('') }}>
                    Cancel
                </Button>
                <Button variant="solid" onClick={handleAddMembers} disabled={selectedToAdd.length === 0}>
                    Add {selectedToAdd.length > 0 ? `(${selectedToAdd.length})` : ''}
                </Button>
            </div>
        </Dialog>
        </>
    )
}

export default ContactInfoDrawer
