'use client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'

const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
]

const PersonalInfoSection = ({ control, errors }) => {
    return (
        <Card>
            <h4 className="mb-6">Personal Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem label="Date of Birth">
                    <Controller
                        name="birthday"
                        control={control}
                        render={({ field }) => (
                            <Input type="date" autoComplete="off" {...field} />
                        )}
                    />
                </FormItem>
                <FormItem label="Gender">
                    <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                            <Select
                                instanceId="gender"
                                options={genderOptions}
                                isClearable
                                placeholder="Select..."
                                value={genderOptions.find(o => o.value === field.value) || null}
                                onChange={(o) => field.onChange(o?.value || '')}
                            />
                        )}
                    />
                </FormItem>
                <FormItem label="Password" className="md:col-span-2">
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="password"
                                autoComplete="new-password"
                                placeholder="Leave empty to keep current"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
            <h5 className="mt-6 mb-4 text-sm font-semibold">Social Media</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem label="Facebook">
                    <Controller name="facebook" control={control} render={({ field }) => <Input type="text" autoComplete="off" placeholder="facebook.com/username" {...field} />} />
                </FormItem>
                <FormItem label="Twitter / X">
                    <Controller name="twitter" control={control} render={({ field }) => <Input type="text" autoComplete="off" placeholder="x.com/username" {...field} />} />
                </FormItem>
                <FormItem label="LinkedIn">
                    <Controller name="linkedIn" control={control} render={({ field }) => <Input type="text" autoComplete="off" placeholder="linkedin.com/in/username" {...field} />} />
                </FormItem>
                <FormItem label="Pinterest">
                    <Controller name="pinterest" control={control} render={({ field }) => <Input type="text" autoComplete="off" placeholder="pinterest.com/username" {...field} />} />
                </FormItem>
            </div>
        </Card>
    )
}

export default PersonalInfoSection
