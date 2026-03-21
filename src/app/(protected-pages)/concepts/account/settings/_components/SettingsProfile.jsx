'use client'
import { useMemo, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Upload from '@/components/ui/Upload'
import Input from '@/components/ui/Input'
import Select, { Option as DefaultOption } from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import { Form, FormItem } from '@/components/ui/Form'
import NumericInput from '@/components/shared/NumericInput'
import { countryList } from '@/constants/countries.constant'
import { components } from 'react-select'
import { apiGetSettingsProfile, apiPutSettingsProfile } from '@/services/AccontsService'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import useSWR from 'swr'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import useProfileStore from '@/utils/hooks/useProfileStore'
import { z } from 'zod'
import { HiOutlineUser } from 'react-icons/hi'
import { TbPlus } from 'react-icons/tb'

const { Control } = components

const validationSchema = z.object({
    firstName: z.string().optional().default(''),
    lastName: z.string().optional().default(''),
    email: z
        .string()
        .min(1, { message: 'Email required' })
        .email({ message: 'Invalid email' }),
    dialCode: z.string().optional().default(''),
    phoneNumber: z.string().optional().default(''),
    country: z.string().optional().default(''),
    address: z.string().optional().default(''),
    postcode: z.string().optional().default(''),
    city: z.string().optional().default(''),
    img: z.string().optional().default(''),
})

const CustomSelectOption = (props) => {
    return (
        <DefaultOption
            {...props}
            customLabel={(data, label) => (
                <span className="flex items-center gap-2">
                    <Avatar
                        shape="circle"
                        size={20}
                        src={`/img/countries/${data.value}.png`}
                    />
                    {props.variant === 'country' && <span>{label}</span>}
                    {props.variant === 'phone' && <span>{data.dialCode}</span>}
                </span>
            )}
        />
    )
}

const CustomControl = ({ children, ...props }) => {
    const selected = props.getValue()[0]
    return (
        <Control {...props}>
            {selected && (
                <Avatar
                    className="ltr:ml-4 rtl:mr-4"
                    shape="circle"
                    size={20}
                    src={`/img/countries/${selected.value}.png`}
                />
            )}
            {children}
        </Control>
    )
}

const SettingsProfile = () => {
    const setProfile = useProfileStore((s) => s.setProfile)
    const { update: updateSession } = useSession()
    const { data, mutate, isLoading, error: fetchError } = useSWR(
        '/api/settings/profile/',
        () => apiGetSettingsProfile(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const dialCodeList = useMemo(() => {
        const newCountryList = JSON.parse(JSON.stringify(countryList))

        return newCountryList.map((country) => {
            country.label = country.dialCode
            return country
        })
    }, [])

    const beforeUpload = (files) => {
        let valid = true

        const allowedFileType = ['image/jpeg', 'image/png']
        if (files) {
            const fileArray = Array.from(files)
            for (const file of fileArray) {
                if (!allowedFileType.includes(file.type)) {
                    valid = 'Please upload a .jpeg or .png file!'
                }
            }
        }

        return valid
    }

    const {
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        control,
    } = useForm({
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        if (data && !data.error) {
            reset(data)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    const onSubmit = async (values) => {
        try {
            await apiPutSettingsProfile(values)
            if (data) {
                mutate({ ...data, ...values }, false)
            }
            // Push to zustand store so header avatar/name updates instantly
            const displayName = [values.firstName, values.lastName]
                .filter(Boolean)
                .join(' ')
            setProfile({
                name: displayName || null,
                image: values.img || null,
                email: values.email || null,
            })
            // Refresh the NextAuth JWT so session persists across page refreshes
            await updateSession()
            toast.push(
                <Notification type="success">Profile saved</Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {error?.response?.data?.error || 'Failed to save profile'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    if (isLoading) {
        return <div className="py-8 text-center">Loading profile...</div>
    }

    if (fetchError) {
        return (
            <div className="py-8 text-center text-red-500">
                Failed to load profile. Please refresh the page.
            </div>
        )
    }

    return (
        <>
            <h4 className="mb-8">Personal information</h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-8">
                    <Controller
                        name="img"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center gap-4">
                                <Avatar
                                    size={90}
                                    className="border-4 border-white bg-gray-100 text-gray-300 shadow-lg"
                                    icon={<HiOutlineUser />}
                                    src={field.value}
                                />
                                <div className="flex items-center gap-2">
                                    <Upload
                                        showList={false}
                                        uploadLimit={1}
                                        beforeUpload={beforeUpload}
                                        onChange={async (files) => {
                                            if (files.length > 0) {
                                                const form = new FormData()
                                                form.append('file', files[0])
                                                form.append('folder', 'avatars')
                                                try {
                                                    const res = await fetch('/api/upload', {
                                                        method: 'POST',
                                                        body: form,
                                                    })
                                                    const json = await res.json()
                                                    if (json.url) {
                                                        field.onChange(json.url)
                                                    }
                                                } catch (err) {
                                                    console.error('Upload failed:', err)
                                                }
                                            }
                                        }}
                                    >
                                        <Button
                                            variant="solid"
                                            size="sm"
                                            type="button"
                                            icon={<TbPlus />}
                                        >
                                            Upload Image
                                        </Button>
                                    </Upload>
                                    <Button
                                        size="sm"
                                        type="button"
                                        onClick={() => {
                                            field.onChange('')
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        )}
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <FormItem
                        label="First name"
                        invalid={Boolean(errors.firstName)}
                        errorMessage={errors.firstName?.message}
                    >
                        <Controller
                            name="firstName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="First Name"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="User name"
                        invalid={Boolean(errors.lastName)}
                        errorMessage={errors.lastName?.message}
                    >
                        <Controller
                            name="lastName"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Last Name"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
                <FormItem
                    label="Email"
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                autoComplete="off"
                                placeholder="Email"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <div className="flex items-end gap-4 w-full mb-6">
                    <FormItem
                        invalid={
                            Boolean(errors.phoneNumber) ||
                            Boolean(errors.dialCode)
                        }
                    >
                        <label className="form-label mb-2">Phone number</label>
                        <Controller
                            name="dialCode"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    instanceId="dial-code"
                                    options={dialCodeList}
                                    {...field}
                                    className="w-[150px]"
                                    components={{
                                        Option: (props) => (
                                            <CustomSelectOption
                                                variant="phone"
                                                {...props}
                                            />
                                        ),
                                        Control: CustomControl,
                                    }}
                                    placeholder=""
                                    value={dialCodeList.filter(
                                        (option) =>
                                            option.dialCode === field.value,
                                    )}
                                    onChange={(option) =>
                                        field.onChange(option?.dialCode)
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        className="w-full"
                        invalid={
                            Boolean(errors.phoneNumber) ||
                            Boolean(errors.dialCode)
                        }
                        errorMessage={errors.phoneNumber?.message}
                    >
                        <Controller
                            name="phoneNumber"
                            control={control}
                            render={({ field }) => (
                                <NumericInput
                                    autoComplete="off"
                                    placeholder="Phone Number"
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                    </FormItem>
                </div>
                <h4 className="mb-6">Address information</h4>
                <FormItem
                    label="Country"
                    invalid={Boolean(errors.country)}
                    errorMessage={errors.country?.message}
                >
                    <Controller
                        name="country"
                        control={control}
                        render={({ field }) => (
                            <Select
                                instanceId="country"
                                options={countryList}
                                {...field}
                                components={{
                                    Option: (props) => (
                                        <CustomSelectOption
                                            variant="country"
                                            {...props}
                                        />
                                    ),
                                    Control: CustomControl,
                                }}
                                placeholder=""
                                value={countryList.filter(
                                    (option) => option.value === field.value,
                                )}
                                onChange={(option) =>
                                    field.onChange(option?.value)
                                }
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Address"
                    invalid={Boolean(errors.address)}
                    errorMessage={errors.address?.message}
                >
                    <Controller
                        name="address"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Address"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem
                        label="City"
                        invalid={Boolean(errors.city)}
                        errorMessage={errors.city?.message}
                    >
                        <Controller
                            name="city"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="City"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Postal Code"
                        invalid={Boolean(errors.postcode)}
                        errorMessage={errors.postcode?.message}
                    >
                        <Controller
                            name="postcode"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Postal Code"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                </div>
                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                    >
                        Save
                    </Button>
                </div>
            </Form>
        </>
    )
}

export default SettingsProfile
