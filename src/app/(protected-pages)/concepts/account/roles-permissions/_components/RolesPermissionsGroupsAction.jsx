'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useRolePermissionsStore } from '../_store/rolePermissionsStore'
import { apiPutRolesUsers } from '@/services/AccontsService'
import { TbPlus } from 'react-icons/tb'

const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Blocked', value: 'blocked' },
]

const RolesPermissionsGroupsAction = () => {
    const { setRoleDialog, userList, setUserList, roleList } =
        useRolePermissionsStore()
    const [addUserOpen, setAddUserOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        title: '',
        role: 'user',
        status: 'active',
    })

    const roleOptions = roleList.map((r) => ({ label: r.name, value: r.id }))

    const handleAddUser = async () => {
        if (!form.name || !form.email || !form.password) {
            toast.push(
                <Notification type="danger">
                    Name, email and password are required
                </Notification>,
                { placement: 'top-center' },
            )
            return
        }
        setSaving(true)
        try {
            const res = await apiPutRolesUsers({
                action: 'addUser',
                ...form,
            })
            setUserList([
                {
                    id: res.data.id,
                    name: form.name,
                    email: form.email,
                    img: null,
                    role: form.role,
                    status: form.status,
                    lastOnline: Math.floor(Date.now() / 1000),
                    phone: form.phone,
                    title: form.title,
                },
                ...userList,
            ])
            toast.push(
                <Notification type="success">User added</Notification>,
                { placement: 'top-center' },
            )
            setAddUserOpen(false)
            setForm({ name: '', email: '', password: '', phone: '', title: '', role: 'user', status: 'active' })
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {error?.response?.data?.error || 'Failed to add user'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
        setSaving(false)
    }

    return (
        <div className="flex gap-2">
            <Button
                variant="default"
                icon={<TbPlus />}
                onClick={() => setAddUserOpen(true)}
            >
                Add user
            </Button>
            <Button
                variant="solid"
                onClick={() =>
                    setRoleDialog({ type: 'new', open: true })
                }
            >
                Create role
            </Button>

            <Dialog
                isOpen={addUserOpen}
                onClose={() => setAddUserOpen(false)}
                onRequestClose={() => setAddUserOpen(false)}
            >
                <h4>Add user</h4>
                <div className="mt-4 flex flex-col gap-2">
                    <FormItem label="Full name">
                        <Input
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            placeholder="John Doe"
                        />
                    </FormItem>
                    <FormItem label="Email">
                        <Input
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            placeholder="john@example.com"
                        />
                    </FormItem>
                    <FormItem label="Password">
                        <Input
                            type="password"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                            placeholder="••••••••"
                        />
                    </FormItem>
                    <FormItem label="Phone">
                        <Input
                            value={form.phone}
                            onChange={(e) =>
                                setForm({ ...form, phone: e.target.value })
                            }
                            placeholder="+212 600 000000"
                        />
                    </FormItem>
                    <FormItem label="Title / Position">
                        <Input
                            value={form.title}
                            onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                            }
                            placeholder="e.g. Developer, Manager"
                        />
                    </FormItem>
                    <div className="grid grid-cols-2 gap-2">
                        <FormItem label="Role">
                            <Select
                                instanceId="add-user-role"
                                options={roleOptions}
                                value={roleOptions.find(
                                    (o) => o.value === form.role,
                                )}
                                onChange={(option) =>
                                    setForm({
                                        ...form,
                                        role: option?.value || 'user',
                                    })
                                }
                            />
                        </FormItem>
                        <FormItem label="Status">
                            <Select
                                instanceId="add-user-status"
                                options={statusOptions}
                                value={statusOptions.find(
                                    (o) => o.value === form.status,
                                )}
                                onChange={(option) =>
                                    setForm({
                                        ...form,
                                        status: option?.value || 'active',
                                    })
                                }
                            />
                        </FormItem>
                    </div>
                    <Button
                        variant="solid"
                        loading={saving}
                        onClick={handleAddUser}
                        className="mt-2"
                    >
                        Add user
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default RolesPermissionsGroupsAction
