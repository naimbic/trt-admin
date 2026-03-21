'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Segment from '@/components/ui/Segment'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import classNames from '@/utils/classNames'
import { apiPutPricingPlan } from '@/services/AccontsService'
import { usePricingStore } from '../_store/pricingStore'
import { TbCheck, TbCreditCard, TbMail } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import {
    NumericFormat,
    PatternFormat,
    NumberFormatBase,
} from 'react-number-format'

function limit(val, max) {
    if (val.length === 1 && val[0] > max[0]) {
        val = '0' + val
    }
    if (val.length === 2) {
        if (Number(val) === 0) {
            val = '01'
        } else if (val > max) {
            val = max
        }
    }
    return val
}

function cardExpiryFormat(val) {
    const month = limit(val.substring(0, 2), '12')
    const date = limit(val.substring(2, 4), '31')
    return month + (date.length ? '/' + date : '')
}

const PaymentDialog = () => {
    const [loading, setLoading] = useState(false)
    const [paymentSuccessful, setPaymentSuccessful] = useState(false)
    const [email, setEmail] = useState('')
    const [ccNumber, setCcNumber] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cvc, setCvc] = useState('')

    const router = useRouter()

    const { paymentDialog, setPaymentDialog, selectedPlan, setSelectedPlan } =
        usePricingStore()

    const handleDialogClose = () => {
        setPaymentDialog(false)
        setTimeout(() => {
            setSelectedPlan({})
            setPaymentSuccessful(false)
            setEmail('')
            setCcNumber('')
            setCardExpiry('')
            setCvc('')
        }, 200)
    }

    const handlePaymentChange = (paymentCycle) => {
        setSelectedPlan({ ...selectedPlan, paymentCycle })
    }

    const handlePay = async () => {
        if (!ccNumber || ccNumber.length < 13) {
            toast.push(
                <Notification type="danger">
                    Enter a valid credit card number
                </Notification>,
                { placement: 'top-center' },
            )
            return
        }
        setLoading(true)
        try {
            const amount =
                selectedPlan.price?.[selectedPlan.paymentCycle] || 0
            await apiPutPricingPlan({
                action: 'subscribe',
                planId: selectedPlan.planId || selectedPlan.planName?.toLowerCase(),
                planName: selectedPlan.planName,
                amount,
                billingCycle: selectedPlan.paymentCycle,
                card: {
                    ccNumber: ccNumber.replace(/\s/g, ''),
                    cardExpiry,
                    cardHolderName: email,
                },
            })
            setPaymentSuccessful(true)
        } catch (error) {
            toast.push(
                <Notification type="danger">
                    {error?.response?.data?.error || 'Payment failed'}
                </Notification>,
                { placement: 'top-center' },
            )
        }
        setLoading(false)
    }

    const handleManageSubscription = () => {
        router.push('/concepts/account/settings?view=billing')
        handleDialogClose()
    }

    const currentAmount =
        selectedPlan.price?.[selectedPlan.paymentCycle] || 0

    return (
        <Dialog
            isOpen={paymentDialog}
            closable={!paymentSuccessful}
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            {paymentSuccessful ? (
                <div className="text-center mt-6 mb-2">
                    <div className="inline-flex rounded-full p-5 bg-success">
                        <TbCheck className="text-5xl text-white" />
                    </div>
                    <div className="mt-6">
                        <h4>Thank you for your purchase!</h4>
                        <p className="text-base max-w-[400px] mx-auto mt-4 leading-relaxed">
                            Your {selectedPlan.planName} plan is now active.
                            You&apos;ll get an email with your order details
                            soon.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-8">
                        <Button block onClick={handleManageSubscription}>
                            Manage subscription
                        </Button>
                        <Button
                            block
                            variant="solid"
                            onClick={handleDialogClose}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <h4>{selectedPlan.planName} plan</h4>
                    <div className="mt-6">
                        <Segment
                            defaultValue={selectedPlan.paymentCycle}
                            className="gap-4 flex bg-transparent dark:bg-transparent"
                            onChange={(value) => handlePaymentChange(value)}
                        >
                            {Object.entries(selectedPlan.price || {}).map(
                                ([key, value]) => (
                                    <Segment.Item key={key} value={key}>
                                        {({ active, onSegmentItemClick }) => (
                                            <div
                                                className={classNames(
                                                    'flex justify-between border rounded-xl border-gray-300 dark:border-gray-600 py-5 px-4 select-none ring-1 w-1/2',
                                                    active
                                                        ? 'ring-primary border-primary'
                                                        : 'ring-transparent bg-gray-100 dark:bg-gray-600',
                                                )}
                                                role="button"
                                                onClick={onSegmentItemClick}
                                            >
                                                <div>
                                                    <div className="heading-text mb-0.5">
                                                        Pay{' '}
                                                        {key === 'monthly'
                                                            ? 'monthly'
                                                            : 'annually'}
                                                    </div>
                                                    <span className="text-lg font-bold heading-text flex gap-0.5">
                                                        <NumericFormat
                                                            displayType="text"
                                                            value={value}
                                                            prefix={'$'}
                                                            thousandSeparator
                                                        />
                                                        <span>/</span>
                                                        <span>
                                                            {key === 'monthly'
                                                                ? 'month'
                                                                : 'year'}
                                                        </span>
                                                    </span>
                                                </div>
                                                {active && (
                                                    <TbCheck className="text-primary text-xl" />
                                                )}
                                            </div>
                                        )}
                                    </Segment.Item>
                                ),
                            )}
                        </Segment>
                    </div>
                    <div className="mt-6 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
                            <div className="w-full">
                                <span>Billing email</span>
                                <div className="flex items-center gap-2 mt-2">
                                    <TbMail className="text-2xl" />
                                    <input
                                        className="focus:outline-hidden heading-text flex-1"
                                        placeholder="Enter email"
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="w-full">
                                <span>Credit card</span>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1">
                                        <TbCreditCard className="text-2xl" />
                                    </div>
                                    <PatternFormat
                                        className="focus:outline-hidden heading-text w-full"
                                        placeholder="Credit card number"
                                        format="#### #### #### ####"
                                        value={ccNumber}
                                        onValueChange={(v) =>
                                            setCcNumber(v.value)
                                        }
                                    />
                                    <NumberFormatBase
                                        className="focus:outline-hidden heading-text max-w-12 sm:max-w-28"
                                        placeholder="MM/YY"
                                        format={cardExpiryFormat}
                                        value={cardExpiry}
                                        onValueChange={(v) =>
                                            setCardExpiry(v.formattedValue)
                                        }
                                    />
                                    <PatternFormat
                                        className="focus:outline-hidden heading-text max-w-12 sm:max-w-28"
                                        placeholder="CVC"
                                        format="###"
                                        value={cvc}
                                        onValueChange={(v) =>
                                            setCvc(v.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col items-end">
                        <h4>
                            <span>Bill now: </span>
                            <NumericFormat
                                displayType="text"
                                value={currentAmount}
                                prefix={'$'}
                                thousandSeparator
                            />
                        </h4>
                        <div className="max-w-[350px] ltr:text-right rtl:text-left leading-none mt-2 opacity-80">
                            <small>
                                By clicking &quot;Pay&quot;, you agree to be
                                charged ${currentAmount} every{' '}
                                {selectedPlan.paymentCycle === 'monthly'
                                    ? 'month'
                                    : 'year'}
                                . You can cancel anytime.
                            </small>
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button
                            block
                            variant="solid"
                            loading={loading}
                            onClick={handlePay}
                        >
                            Pay
                        </Button>
                    </div>
                </>
            )}
        </Dialog>
    )
}

export default PaymentDialog
