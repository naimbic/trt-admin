'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { Form, FormItem } from '@/components/ui/Form'
import { usePricingStore } from '../_store/pricingStore'
import { featuresList } from '../constants'
import { apiPutPricingPlan } from '@/services/AccontsService'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import { NumericFormat } from 'react-number-format'
import { TbCheck, TbPencil } from 'react-icons/tb'

const Plans = ({ data: initialData, subcription, cycle }) => {
    const { paymentCycle, setPaymentDialog, setSelectedPlan } =
        usePricingStore()
    const [plans, setPlans] = useState(initialData?.plans || [])
    const [editPlan, setEditPlan] = useState(null)
    const [saving, setSaving] = useState(false)

    const handleEditSave = async () => {
        setSaving(true)
        try {
            await apiPutPricingPlan({
                action: 'updatePlan',
                planId: editPlan.id,
                name: editPlan.name,
                description: editPlan.description,
                monthlyPrice: Number(editPlan.price.monthly),
                annualPrice: Number(editPlan.price.annually),
                features: editPlan.features,
                recommended: editPlan.recommended,
            })
            setPlans((prev) =>
                prev.map((p) => (p.id === editPlan.id ? editPlan : p)),
            )
            toast.push(
                <Notification type="success">Plan updated</Notification>,
                { placement: 'top-center' },
            )
            setEditPlan(null)
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {error?.response?.data?.error || 'Failed to update plan'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
        setSaving(false)
    }

    return (
        <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:gap-4">
                {plans.map((plan, index) => (
                    <div
                        key={plan.id}
                        className={classNames(
                            'px-6 pt-2 flex flex-col justify-between',
                            !isLastChild(plans, index) &&
                                'border-r-0 xl:border-r border-gray-200 dark:border-gray-700',
                        )}
                    >
                        <div>
                            <h5 className="mb-6 flex items-center gap-2">
                                <span>{plan.name}</span>
                                {plan.recommended && (
                                    <Tag className="rounded-full bg-green-200 font-bold">
                                        Recommended
                                    </Tag>
                                )}
                                <button
                                    type="button"
                                    className="ml-auto text-gray-400 hover:text-primary"
                                    onClick={() =>
                                        setEditPlan({
                                            ...plan,
                                            price: { ...plan.price },
                                        })
                                    }
                                    aria-label={`Edit ${plan.name} plan`}
                                >
                                    <TbPencil className="text-lg" />
                                </button>
                            </h5>
                            <div>{plan.description}</div>
                            <div className="mt-6">
                                <NumericFormat
                                    className="h1"
                                    displayType="text"
                                    value={plan.price[paymentCycle]}
                                    prefix={'$'}
                                    thousandSeparator
                                />
                                <span className="text-lg font-bold">
                                    {' '}
                                    /{' '}
                                    {paymentCycle === 'monthly'
                                        ? 'month'
                                        : 'year'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-4 border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
                                {featuresList.map((feature) => (
                                    <div
                                        key={feature.id}
                                        className="flex items-center gap-4 font-semibold heading-text"
                                    >
                                        {plan.features.includes(
                                            feature.id,
                                        ) && (
                                            <>
                                                <TbCheck className="text-2xl text-primary" />
                                                <span>
                                                    {
                                                        feature.description[
                                                            plan.id
                                                        ]
                                                    }
                                                </span>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-10">
                            <Button
                                block
                                disabled={
                                    subcription === plan.id &&
                                    cycle === paymentCycle
                                }
                                onClick={() => {
                                    setSelectedPlan({
                                        paymentCycle,
                                        planName: plan.name,
                                        planId: plan.id,
                                        price: plan.price,
                                    })
                                    setPaymentDialog(true)
                                }}
                            >
                                {subcription === plan.id &&
                                cycle === paymentCycle
                                    ? 'Current plan'
                                    : 'Select plan'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Plan Dialog */}
            <Dialog
                isOpen={!!editPlan}
                onClose={() => setEditPlan(null)}
                onRequestClose={() => setEditPlan(null)}
            >
                {editPlan && (
                    <>
                        <h4>Edit {editPlan.name} Plan</h4>
                        <div className="mt-4 flex flex-col gap-4">
                            <FormItem label="Plan name">
                                <Input
                                    value={editPlan.name}
                                    onChange={(e) =>
                                        setEditPlan({
                                            ...editPlan,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </FormItem>
                            <FormItem label="Description">
                                <Input
                                    textArea
                                    value={editPlan.description}
                                    onChange={(e) =>
                                        setEditPlan({
                                            ...editPlan,
                                            description: e.target.value,
                                        })
                                    }
                                />
                            </FormItem>
                            <div className="grid grid-cols-2 gap-4">
                                <FormItem label="Monthly price ($)">
                                    <Input
                                        type="number"
                                        value={editPlan.price.monthly}
                                        onChange={(e) =>
                                            setEditPlan({
                                                ...editPlan,
                                                price: {
                                                    ...editPlan.price,
                                                    monthly: Number(
                                                        e.target.value,
                                                    ),
                                                },
                                            })
                                        }
                                    />
                                </FormItem>
                                <FormItem label="Annual price ($)">
                                    <Input
                                        type="number"
                                        value={editPlan.price.annually}
                                        onChange={(e) =>
                                            setEditPlan({
                                                ...editPlan,
                                                price: {
                                                    ...editPlan.price,
                                                    annually: Number(
                                                        e.target.value,
                                                    ),
                                                },
                                            })
                                        }
                                    />
                                </FormItem>
                            </div>
                            <Button
                                variant="solid"
                                loading={saving}
                                onClick={handleEditSave}
                            >
                                Save changes
                            </Button>
                        </div>
                    </>
                )}
            </Dialog>
        </>
    )
}

export default Plans
