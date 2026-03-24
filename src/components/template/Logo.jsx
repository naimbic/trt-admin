import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'

const LOGO_LIGHT = process.env.NEXT_PUBLIC_LOGO_LIGHT || '/img/logo/logo-light-full.png'
const LOGO_DARK = process.env.NEXT_PUBLIC_LOGO_DARK || '/img/logo/logo-dark-full.png'

const Logo = (props) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        imgClass,
        style,
        logoWidth,
    } = props

    const width = logoWidth || (type === 'full' ? 140 : 40)
    const src = mode === 'dark' ? LOGO_DARK : LOGO_LIGHT

    return (
        <div className={classNames('logo', className)} style={style}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                className={imgClass}
                src={src}
                alt={`${APP_NAME} logo`}
                style={{ width, height: 'auto' }}
            />
        </div>
    )
}

export default Logo
