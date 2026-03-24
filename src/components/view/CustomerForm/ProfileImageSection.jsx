'use client'
import { useState } from 'react'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Upload from '@/components/ui/Upload'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import DoubleSidedImage from '@/components/shared/DoubleSidedImage'
import { Controller } from 'react-hook-form'
import { HiOutlineUser } from 'react-icons/hi'

const ProfileImage = ({ control }) => {
    const [uploading, setUploading] = useState(false)

    const beforeUpload = (files) => {
        let valid = true
        const allowedFileType = ['image/jpeg', 'image/png', 'image/webp']
        if (files) {
            Array.from(files).forEach((file) => {
                if (!allowedFileType.includes(file.type)) {
                    valid = 'Please upload a .jpeg, .png or .webp file!'
                }
                if (file.size > 5 * 1024 * 1024) {
                    valid = 'File size must be less than 5MB!'
                }
            })
        }
        return valid
    }

    const handleUpload = async (files, onChange) => {
        if (!files || files.length === 0) return
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', files[0])
            formData.append('folder', 'avatars')
            const res = await fetch('/api/upload', { method: 'POST', body: formData })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Upload failed')
            onChange(json.url)
        } catch (err) {
            toast.push(
                <Notification type="danger">{err.message}</Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setUploading(false)
        }
    }

    return (
        <Card>
            <h4 className="mb-6">Image</h4>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg text-center p-4">
                <div className="text-center">
                    <Controller
                        name="img"
                        control={control}
                        render={({ field }) => (
                            <>
                                <div className="flex items-center justify-center">
                                    {field.value ? (
                                        <Avatar
                                            size={100}
                                            className="border-4 border-white bg-gray-100 text-gray-300 shadow-lg"
                                            icon={<HiOutlineUser />}
                                            src={field.value}
                                        />
                                    ) : (
                                        <DoubleSidedImage
                                            src="/img/others/upload.png"
                                            darkModeSrc="/img/others/upload-dark.png"
                                            alt="Upload image"
                                        />
                                    )}
                                </div>
                                <Upload
                                    showList={false}
                                    uploadLimit={1}
                                    beforeUpload={beforeUpload}
                                    onChange={(files) => handleUpload(files, field.onChange)}
                                >
                                    <Button
                                        variant="solid"
                                        className="mt-4"
                                        type="button"
                                        loading={uploading}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Image'}
                                    </Button>
                                </Upload>
                            </>
                        )}
                    />
                </div>
            </div>
        </Card>
    )
}

export default ProfileImage
