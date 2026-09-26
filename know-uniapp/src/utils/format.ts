/**
 * 展示层脱敏工具
 * 设计规范（uniapp 客户界面设计 06）：列表/详情展示 phone/email 脱敏，编辑回填必须真实值。
 */

export function maskPhone(phone?: string | null): string {
    if (!phone) return '--'
    const p = String(phone).trim()
    if (p.length === 11) {
        return `${p.slice(0, 3)}****${p.slice(7)}`
    }
    if (p.length >= 7) {
        return `${p.slice(0, 2)}***${p.slice(-2)}`
    }
    if (p.length > 1) {
        return `${p.slice(0, 1)}***`
    }
    return p
}

export function maskEmail(email?: string | null): string {
    if (!email) return '--'
    const e = String(email).trim()
    const at = e.indexOf('@')
    if (at <= 0) return e
    const local = e.slice(0, at)
    const domain = e.slice(at)
    if (local.length > 2) {
        return `${local[0]}***${local[local.length - 1]}${domain}`
    }
    if (local.length === 2) {
        return `${local[0]}***${domain}`
    }
    return `${local}${domain}`
}