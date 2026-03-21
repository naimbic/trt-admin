import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'

const LOGO_LIGHT = 'https://trtdigital-ma.ams3.digitaloceanspaces.com/wp-content/uploads/2021/08/trtDigital-Logo-Maroc-2.svg'
const LOGO_DARK = 'https://trtdigital-ma.ams3.digitaloceanspaces.com/wp-content/uploads/2021/08/trtDigital-Logo-Maroc-light_V4.0.svg'

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
