// Convert number to French words for invoice total
const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf', 'Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-sept', 'Dix-huit', 'Dix-neuf']
const tens = ['', '', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante', 'Quatre-vingt', 'Quatre-vingt']

function convertBelow1000(n) {
    if (n === 0) return ''
    if (n < 20) return units[n]
    if (n < 100) {
        const t = Math.floor(n / 10)
        const u = n % 10
        // French special cases: 70-79, 90-99
        if (t === 7) return 'Soixante' + (u === 1 ? ' et ' : '-') + units[10 + u]
        if (t === 9) return 'Quatre-vingt-' + units[10 + u]
        if (u === 0) return tens[t] + (t === 8 ? 's' : '')
        if (u === 1 && t < 8) return tens[t] + ' et Un'
        return tens[t] + '-' + units[u]
    }
    const h = Math.floor(n / 100)
    const rest = n % 100
    let result = h === 1 ? 'Cent' : units[h] + ' Cent'
    if (rest === 0 && h > 1) result += 's'
    else if (rest > 0) result += ' ' + convertBelow1000(rest)
    return result
}

export function numberToFrenchWords(amount) {
    if (amount === 0) return 'Zéro'
    const intPart = Math.floor(Math.abs(amount))
    const decPart = Math.round((Math.abs(amount) - intPart) * 100)

    let result = ''
    if (intPart === 0) {
        result = 'Zéro'
    } else if (intPart < 1000) {
        result = convertBelow1000(intPart)
    } else if (intPart < 1000000) {
        const thousands = Math.floor(intPart / 1000)
        const rest = intPart % 1000
        result = (thousands === 1 ? 'Mille' : convertBelow1000(thousands) + ' Mille')
        if (rest > 0) result += ' ' + convertBelow1000(rest)
    } else {
        const millions = Math.floor(intPart / 1000000)
        const rest = intPart % 1000000
        result = convertBelow1000(millions) + (millions === 1 ? ' Million' : ' Millions')
        if (rest > 0) {
            const thousands = Math.floor(rest / 1000)
            const remainder = rest % 1000
            if (thousands > 0) result += ' ' + (thousands === 1 ? 'Mille' : convertBelow1000(thousands) + ' Mille')
            if (remainder > 0) result += ' ' + convertBelow1000(remainder)
        }
    }

    if (decPart > 0) {
        result += ' et ' + convertBelow1000(decPart) + ' Centimes'
    }

    return result
}
