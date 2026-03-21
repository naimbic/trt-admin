'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import Skeleton from '@/components/ui/Skeleton'
import UsersAvatarGroup from '@/components/shared/UsersAvatarGroup'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { apiPutRole } from '@/services/AccontsService'
import { TbArrowRight, TbTrash } from 'react-icons/tb'

const RolesPermissionsGroups = () => {
    const roleList = useRolePermissionsStore((state) => state.roleList)
    const setRoleList = useRolePermissionsStore((state) => state.setRoleList)
    const setRoleDialog = useRolePermissionsStore(
        (state) => state.setRoleDialog,
    )
    const setSelectedRole = useRolePermissionsStore(
        (state) => state.setSelectedRole,
    )
    const initialLoading = useRolePermissionsStore(
        (state) => state.initialLoading,
    )

    const [deleteTarget, setDeleteTarget] = useState(null)

    const handleEditRoleClick = (id) => {
        setSelectedRole(id)
        setRoleDialog({
            type: 'edit',
            open: true,
        })
    }

    const handleDeleteRole = async () => {
        if (!deleteTarget) return
        try {
            await apiPutRole({ action: 'delete', roleId: deleteTarget.id })
            setRoleList(roleList.filter((r) => r.id !== deleteTarget.id))
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
        setDeleteTarget(null)
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {initialLoading && roleList.length === 0 ? (
                <>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex flex-col justify-between rounded-2xl p-5 bg-gray-100 dark:bg-gray-700 min-h-[140px]"
                        >
                            <div className="flex flex-auto flex-col justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <Skeleton
                                            variant="circle"
                                            height={35}
                                            width={35}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4 w-full">
                                        <Skeleton height={10} />
                                        <Skeleton height={10} width="60%" />
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        <Skeleton
                                            variant="circle"
                                            height={20}
                                            width={20}
                                        />
                                    </div>
                                    <Skeleton height={10} width="30%" />
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            ) : (
                roleList.map((role) => (
                    <div
                        key={role.id}
                        className="flex flex-col justify-between rounded-2xl p-5 bg-gray-100 dark:bg-gray-700 min-h-[140px]"
                    >
                        <div className="flex items-center justify-between">
                            <h6 className="font-bold">{role.name}</h6>
                            {role.id !== 'admin' && (
                                <button
                                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer text-red-500"
                                    onClick={() => setDeleteTarget(role)}
                                    type="button"
                                >
                                    <TbTrash />
                                </button>
                            )}
                        </div>
                        <p className="mt-2">{role.description}</p>
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex flex-col">
                                <div className="-ml-2">
                                    <UsersAvatarGroup
                                        avatarProps={{
                                            className:
                                                'cursor-pointer -mr-2 border-2 border-white dark:border-gray-500',
                                            size: 28,
                                        }}
                                        avatarGroupProps={{ maxCount: 3 }}
                                        chained={false}
                                        users={role.users}
                                    />
                                </div>
                            </div>
                            <Button
                                variant="plain"
                                size="sm"
                                className="py-0 h-auto"
                                icon={<TbArrowRight />}
                                iconAlignment="end"
                                onClick={() => handleEditRoleClick(role.id)}
                            >
                                Edit role
                            </Button>
                        </div>
                    </div>
                ))
            )}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                type="danger"
                title="Delete role"
                onClose={() => setDeleteTarget(null)}
                onRequestClose={() => setDeleteTarget(null)}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDeleteRole}
            >
                <p>
                    Are you sure you want to delete the <span className="font-semibold">{deleteTarget?.name}</span> role? Users with this role will need to be reassigned.
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default RolesPermissionsGroups
