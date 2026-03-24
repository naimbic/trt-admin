'use client'
import { useMemo, useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Dropdown from '@/components/ui/Dropdown'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import DataTable from '@/components/shared/DataTable'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import { apiPutRolesUsers } from '@/services/AccontsService'
import useAppendQueryParams from '@/utils/hooks/useAppendQueryParams'
import dayjs from 'dayjs'
import { TbChevronDown, TbTrash, TbLock, TbLockOpen, TbPencil } from 'react-icons/tb'

const statusColor = {
    active: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    blocked: 'bg-red-200 dark:bg-red-200 text-gray-900 dark:text-gray-900',
}

const RolesPermissionsUserTable = (props) => {
    const { userListTotal = 0, pageIndex = 1, pageSize = 10 } = props

    const initialLoading = useRolePermissionsStore(
        (state) => state.initialLoading,
    )
    const roleList = useRolePermissionsStore((state) => state.roleList)
    const userList = useRolePermissionsStore((state) => state.userList)
    const setUserList = useRolePermissionsStore((state) => state.setUserList)
    const selectedUser = useRolePermissionsStore((state) => state.selectedUser)
    const setSelectedUser = useRolePermissionsStore(
        (state) => state.setSelectedUser,
    )
    const setSelectAllUser = useRolePermissionsStore(
        (state) => state.setSelectAllUser,
    )

    const [deleteTarget, setDeleteTarget] = useState(null)
    const [editTarget, setEditTarget] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', title: '', role: '', status: '', password: '' })
    const [editSaving, setEditSaving] = useState(false)

    const { onAppendQueryParams } = useAppendQueryParams()

    const handlePaginationChange = (page) => {
        onAppendQueryParams({
            pageIndex: String(page),
        })
    }

    const handleSelectChange = (value) => {
        onAppendQueryParams({
            pageSize: String(value),
            pageIndex: '1',
        })
    }

    const handleSort = (sort) => {
        onAppendQueryParams({
            order: sort.order,
            sortKey: sort.key,
        })
    }

    const handleRowSelect = (checked, row) => {
        setSelectedUser(checked, row)
    }

    const handleAllRowSelect = (checked, rows) => {
        if (checked) {
            const originalRows = rows.map((row) => row.original)
            setSelectAllUser(originalRows)
        } else {
            setSelectAllUser([])
        }
    }

    const handleRoleChange = async (role, id) => {
        const newUserList = structuredClone(userList).map((user) => {
            if (user.id === id) {
                user.role = role
            }
            return user
        })
        setUserList(newUserList)

        try {
            await apiPutRolesUsers({ action: 'updateRole', userId: id, role })
        } catch {
            toast.push(
                <Notification type="danger">Failed to update role</Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleStatusToggle = async (row) => {
        const newStatus = row.status === 'active' ? 'blocked' : 'active'
        const newUserList = structuredClone(userList).map((user) => {
            if (user.id === row.id) {
                user.status = newStatus
            }
            return user
        })
        setUserList(newUserList)

        try {
            await apiPutRolesUsers({ action: 'updateStatus', userId: row.id, status: newStatus })
            toast.push(
                <Notification type="success">
                    User {newStatus === 'blocked' ? 'blocked' : 'activated'}
                </Notification>,
                { placement: 'top-center' },
            )
        } catch {
            toast.push(
                <Notification type="danger">Failed to update status</Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleDeleteUser = async () => {
        if (!deleteTarget) return
        try {
            await apiPutRolesUsers({ action: 'deleteUsers', userIds: [deleteTarget.id] })
            setUserList(userList.filter((u) => u.id !== deleteTarget.id))
            setSelectAllUser(selectedUser.filter((u) => u.id !== deleteTarget.id))
            toast.push(
                <Notification type="success">User deleted</Notification>,
                { placement: 'top-center' },
            )
        } catch {
            toast.push(
                <Notification type="danger">Failed to delete user</Notification>,
                { placement: 'top-center' },
            )
        }
        setDeleteTarget(null)
    }

    const handleOpenEdit = (row) => {
        setEditForm({
            name: row.name || '',
            email: row.email || '',
            phone: row.phone || '',
            title: row.title || '',
            role: row.role || 'user',
            status: row.status || 'active',
            password: '',
        })
        setEditTarget(row)
    }

    const handleSaveEdit = async () => {
        if (!editTarget) return
        setEditSaving(true)
        try {
            const payload = { action: 'editUser', userId: editTarget.id, ...editForm }
            if (!payload.password) delete payload.password
            await apiPutRolesUsers(payload)
            const newUserList = structuredClone(userList).map((u) => {
                if (u.id === editTarget.id) {
                    u.name = editForm.name
                    u.email = editForm.email
                    u.phone = editForm.phone
                    u.title = editForm.title
                    u.role = editForm.role
                    u.status = editForm.status
                }
                return u
            })
            setUserList(newUserList)
            toast.push(<Notification type="success">User updated</Notification>, { placement: 'top-center' })
            setEditTarget(null)
        } catch {
            toast.push(<Notification type="danger">Failed to update user</Notification>, { placement: 'top-center' })
        }
        setEditSaving(false)
    }

    const statusOptions = [
        { label: 'Active', value: 'active' },
        { label: 'Blocked', value: 'blocked' },
    ]
    const roleOptions = roleList.map((r) => ({ label: r.name, value: r.id }))

    const columns = useMemo(
        () => [
            {
                header: 'Name',
                accessorKey: 'name',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar size={40} shape="circle" src={row.img} />
                            <div>
                                <div className="font-bold heading-text">
                                    {row.name}
                                </div>
                                <div>{row.email}</div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Status',
                accessorKey: 'status',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[row.status]}>
                                <span className="capitalize">{row.status}</span>
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: 'Last online',
                accessorKey: 'lastOnline',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex flex-col">
                            <span className="font-semibold">
                                {dayjs
                                    .unix(row.lastOnline)
                                    .format('MMMM, D YYYY')}
                            </span>
                            <small>
                                {dayjs.unix(row.lastOnline).format('hh:mm A')}
                            </small>
                        </div>
                    )
                },
            },
            {
                header: 'Role',
                accessorKey: 'role',
                size: 70,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <Dropdown
                            renderTitle={
                                <div
                                    className="inline-flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                    role="button"
                                >
                                    <span className="font-bold heading-text">
                                        {
                                            roleList.find(
                                                (role) => role.id === row.role,
                                            )?.name
                                        }
                                    </span>
                                    <TbChevronDown />
                                </div>
                            }
                        >
                            {roleList
                                .filter((role) => role.id !== row.role)
                                .map((role) => (
                                    <Dropdown.Item
                                        key={role.id}
                                        eventKey={role.id}
                                        onClick={() =>
                                            handleRoleChange(role.id, row.id)
                                        }
                                    >
                                        {role.name}
                                    </Dropdown.Item>
                                ))}
                        </Dropdown>
                    )
                },
            },
            {
                header: '',
                id: 'actions',
                size: 80,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-1 justify-end">
                            <Tooltip title="Edit user">
                                <button
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-lg"
                                    onClick={() => handleOpenEdit(row)}
                                    type="button"
                                >
                                    <TbPencil />
                                </button>
                            </Tooltip>
                            <Tooltip title={row.status === 'active' ? 'Block user' : 'Activate user'}>
                                <button
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-lg"
                                    onClick={() => handleStatusToggle(row)}
                                    type="button"
                                >
                                    {row.status === 'active' ? <TbLock /> : <TbLockOpen />}
                                </button>
                            </Tooltip>
                            <Tooltip title="Delete user">
                                <button
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-lg text-red-500"
                                    onClick={() => setDeleteTarget(row)}
                                    type="button"
                                >
                                    <TbTrash />
                                </button>
                            </Tooltip>
                        </div>
                    )
                },
            },
        ], // eslint-disable-next-line react-hooks/exhaustive-deps
        [roleList, userList],
    )

    return (
        <>
            <DataTable
                selectable
                columns={columns}
                data={userList}
                noData={!initialLoading && userList.length === 0}
                skeletonAvatarColumns={[0]}
                skeletonAvatarProps={{ width: 28, height: 28 }}
                loading={initialLoading}
                pagingData={{
                    total: userListTotal,
                    pageIndex,
                    pageSize,
                }}
                checkboxChecked={(row) =>
                    selectedUser.some((selected) => selected.id === row.id)
                }
                hoverable={false}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectChange}
                onSort={handleSort}
                onCheckBoxChange={handleRowSelect}
                onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
            <ConfirmDialog
                isOpen={!!deleteTarget}
                type="danger"
                title="Delete user"
                onClose={() => setDeleteTarget(null)}
                onRequestClose={() => setDeleteTarget(null)}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteUser}
            >
                <p>
                    Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>? This action can&apos;t be undone.
                </p>
            </ConfirmDialog>
            <Dialog
                isOpen={!!editTarget}
                onClose={() => setEditTarget(null)}
                onRequestClose={() => setEditTarget(null)}
            >
                <h4>Edit User</h4>
                <div className="mt-4 flex flex-col gap-2">
                    <FormItem label="Full name">
                        <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="John Doe" />
                    </FormItem>
                    <FormItem label="Email">
                        <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="john@example.com" />
                    </FormItem>
                    <FormItem label="New Password">
                        <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave empty to keep current" />
                    </FormItem>
                    <FormItem label="Phone">
                        <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+212 600 000000" />
                    </FormItem>
                    <FormItem label="Title / Position">
                        <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="e.g. Developer, Manager" />
                    </FormItem>
                    <div className="grid grid-cols-2 gap-2">
                        <FormItem label="Role">
                            <Select instanceId="edit-user-role" options={roleOptions} value={roleOptions.find(o => o.value === editForm.role)} onChange={(o) => setEditForm({ ...editForm, role: o?.value || 'user' })} />
                        </FormItem>
                        <FormItem label="Status">
                            <Select instanceId="edit-user-status" options={statusOptions} value={statusOptions.find(o => o.value === editForm.status)} onChange={(o) => setEditForm({ ...editForm, status: o?.value || 'active' })} />
                        </FormItem>
                    </div>
                    <Button variant="solid" loading={editSaving} onClick={handleSaveEdit} className="mt-2">
                        Save Changes
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default RolesPermissionsUserTable
