'use client'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select, { Option as DefaultOption } from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import { FormItem } from '@/components/ui/Form'
import { countryList } from '@/constants/countries.constant'
import { Controller } from 'react-hook-form'
import { components } from 'react-select'

const { Control } = components

const CustomSelectOption = (props) => (
    <DefaultOption
        {...props}
        customLabel={(data, label) => (
            <span className="flex items-center gap-2">
                <Avatar shape="circle" size={20} src={`/img/countries/${data.value}.png`} />
                <span>{label}</span>
            </span>
        )}
    />
)

const CustomControl = ({ children, ...props }) => {
    const selected = props.getValue()[0]
    return (
        <Control {...props}>
            {selected && (
                <Avatar className="ltr:ml-4 rtl:mr-4" shape="circle" size={20} src={`/img/countries/${selected.value}.png`} />
            )}
            {children}
        </Control>
    )
}

const DeliveryAddressSection = ({ control, errors }) => {
    return (
        <Card>
            <h4 className="mb-6">Delivery Address</h4>
            <FormItem label="Country">
                <Controller
                    name="deliveryCountry"
                    control={control}
                    render={({ field }) => (
                        <Select
                            instanceId="delivery-country"
                            options={countryList}
                            {...field}
                            components={{ Option: CustomSelectOption, Control: CustomControl }}
                            placeholder=""
                            value={countryList.filter(o => o.value === field.value)}
                            onChange={(o) => field.onChange(o?.value || '')}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Address">
                <Controller
                    name="deliveryAddress"
                    control={control}
                    render={({ field }) => (
                        <Input type="text" autoComplete="off" placeholder="Delivery Address" {...field} />
                    )}
                />
            </FormItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem label="City">
                    <Controller
                        name="deliveryCity"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="City" {...field} />
                        )}
                    />
                </FormItem>
                <FormItem label="Postal Code">
                    <Controller
                        name="deliveryPostcode"
                        control={control}
                        render={({ field }) => (
                            <Input type="text" autoComplete="off" placeholder="Postal Code" {...field} />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default DeliveryAddressSection
