'use client'
import { useMemo, useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Segment from '@/components/ui/Segment'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import ScrollBar from '@/components/ui/ScrollBar'
import { FormItem } from '@/components/ui/Form'
import hooks from '@/components/ui/hooks'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import { accessModules } from '../constants'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import sleep from '@/utils/sleep'
import { apiPutRole } from '@/services/AccontsService'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    TbUserCog,
    TbBox,
    TbSettings,
    TbFiles,
    TbFileChart,
    TbCheck,
} from 'react-icons/tb'

const moduleIcon = {
    users: <TbUserCog />,
    products: <TbBox />,
    configurations: <TbSettings />,
    files: <TbFiles />,
    reports: <TbFileChart />,
}

const { useUniqueId } = hooks

const RolesPermissionsAccessDialog = () => {
    const roleList = useRolePermissionsStore((state) => state.roleList)
    const setRoleList = useRolePermissionsStore((state) => state.setRoleList)

    const setRoleDialog = useRolePermissionsStore(
        (state) => state.setRoleDialog,
    )
    const setSelectedRole = useRolePermissionsStore(
        (state) => state.setSelectedRole,
    )

    const selectedRole = useRolePermissionsStore((state) => state.selectedRole)
    const roleDialog = useRolePermissionsStore((state) => state.roleDialog)

    const [accessRight, setAccessRight] = useState({})

    const roleNameRef = useRef(null)
    const descriptionRef = useRef(null)

    const newId = useUniqueId('role-')

    const handleClose = () => {
        setRoleDialog({
            type: '',
            open: false,
        })
        setAccessRight({})
    }

    const handleDelete = async () => {
        if (!selectedRole || selectedRole === 'admin') return
        try {
            await apiPutRole({ action: 'delete', roleId: selectedRole })
            setRoleList(roleList.filter((r) => r.id !== selectedRole))
            toast.push(
                <Notification type="success">Role deleted</Notification>,
                { placement: 'top-center' },
            )
        } catch {
            toast.push(
                <Notification type="danger">Failed to delete role</Notification>,
                { placement: 'top-center' },
            )
        }
        handleClose()
        await sleep(300)
        setSelectedRole('')
    }

    const handleUpdate = async () => {
        try {
            const role = roleList.find((r) => r.id === selectedRole)
            if (role) {
                await apiPutRole({
                    action: 'update',
                    roleId: role.id,
                    name: role.name,
                    description: role.description,
                    accessRight: role.accessRight,
                })
                toast.push(
                    <Notification type="success">Role updated</Notification>,
                    { placement: 'top-center' },
                )
            }
        } catch {
            toast.push(
                <Notification type="danger">Failed to update role</Notification>,
                { placement: 'top-center' },
            )
        }
        handleClose()
        await sleep(300)
        setSelectedRole('')
    }

    const handleSubmit = async () => {
        const roleName = roleNameRef.current?.value || `Untitled-${newId}`
        const roleId = roleName.toLowerCase().replace(/\s+/g, '-')
        try {
            await apiPutRole({
                action: 'create',
                roleId,
                name: roleName,
                description: descriptionRef.current?.value || '',
                accessRight,
            })
            const newRoleList = structuredClone(roleList)
            newRoleList.push({
                id: roleId,
                name: roleName,
                description: descriptionRef.current?.value || '',
                users: [],
                accessRight,
            })
            setRoleList(newRoleList)
            toast.push(
                <Notification type="success">Role created</Notification>,
                { placement: 'top-center' },
            )
        } catch {
            toast.push(
                <Notification type="danger">Failed to create role</Notification>,
                { placement: 'top-center' },
            )
        }
        handleClose()
    }

    const modules = useMemo(() => {
        return roleList.find((role) => role.id === selectedRole)
    }, [selectedRole, roleList])

    const handleChange = (newAccess, key) => {
        if (roleDialog.type === 'new') {
            setAccessRight((prev) => ({
                ...prev,
                [key]: newAccess,
            }))
        }

        if (roleDialog.type === 'edit') {
            const newRoleList = structuredClone(roleList).map((role) => {
                if (role.id === selectedRole) {
                    role.accessRight[key] = newAccess
                }

                return role
            })

            setRoleList(newRoleList)
        }
    }

    return (
        <Dialog
            isOpen={roleDialog.open}
            width={900}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <h4>{roleDialog.type === 'new' ? 'Create role' : modules?.name}</h4>
            <ScrollBar className="mt-6 max-h-[600px] overflow-y-auto">
                <div className="px-4">
                    {roleDialog.type === 'new' && (
                        <>
                            <FormItem label="Role name">
                                <Input ref={roleNameRef} />
                            </FormItem>
                            <FormItem label="Description">
                                <Input ref={descriptionRef} textArea />
                            </FormItem>
                            <span className="font-semibold mb-2">
                                Permission
                            </span>
                        </>
                    )}
                    {accessModules.map((module, index) => (
                        <div
                            key={module.id}
                            className={classNames(
                                'flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-gray-200 dark:border-gray-600',
                                !isLastChild(accessModules, index) &&
                                    'border-b',
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <Avatar
                                    className="bg-transparent dark:bg-transparent p-2 border-2 border-gray-200 dark:border-gray-600 text-primary"
                                    size={50}
                                    icon={moduleIcon[module.id]}
                                    shape="round"
                                />
                                <div>
                                    <h6 className="font-bold">{module.name}</h6>
                                    <span>{module.description}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Segment
                                    className="bg-transparent dark:bg-transparent"
                                    selectionType="multiple"
                                    value={
                                        roleDialog.type === 'new'
                                            ? accessRight[module.id] || []
                                            : modules?.accessRight[module.id] || []
                                    }
                                    onChange={(val) =>
                                        handleChange(val, module.id)
                                    }
                                >
                                    {module.accessor.map((access) => (
                                        <Segment.Item
                                            key={module.id + access.value}
                                            value={access.value}
                                        >
                                            {({
                                                active,
                                                onSegmentItemClick,
                                            }) => {
                                                return (
                                                    <Button
                                                        variant="default"
                                                        icon={
                                                            active ? (
                                                                <TbCheck className="text-primary text-xl" />
                                                            ) : (
                                                                <></>
                                                            )
                                                        }
                                                        active={active}
                                                        type="button"
                                                        className="md:min-w-[100px]"
                                                        size="sm"
                                                        customColorClass={({
                                                            active,
                                                        }) =>
                                                            classNames(
                                                                active &&
                                                                    'bg-transparent dark:bg-transparent text-primary border-primary ring-1 ring-primary',
                                                            )
                                                        }
                                                        onClick={
                                                            onSegmentItemClick
                                                        }
                                                    >
                                                        {access.label}
                                                    </Button>
                                                )
                                            }}
                                        </Segment.Item>
                                    ))}
                                </Segment>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-between mt-6">
                        <div>
                            {roleDialog.type === 'edit' && selectedRole !== 'admin' && (
                                <Button
                                    variant="plain"
                                    customColorClass={() =>
                                        'text-error hover:text-error'
                                    }
                                    onClick={handleDelete}
                                >
                                    Delete role
                                </Button>
                            )}
                        </div>
                        <div className="flex">
                            <Button
                                className="ltr:mr-2 rtl:ml-2"
                                variant="plain"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="solid"
                                onClick={
                                    roleDialog.type === 'edit'
                                        ? handleUpdate
                                        : handleSubmit
                                }
                            >
                                {roleDialog.type === 'edit' ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </div>
            </ScrollBar>
        </Dialog>
    )
}

export default RolesPermissionsAccessDialog
