/**
 * @description 提醒调度模块（App 端本地通知）
 * - 平台：仅 APP-PLUS 生效（#ifdef APP-PLUS 包裹），H5/小程序为空实现
 * - 原理：保存日程/习惯时把提醒注册到本地队列（storage 持久化），App 启动时
 *         重新扫描队列并调用 plus.push.createMessage 注册系统通知
 * - 已知限制（官方文档 + 社区确认）：
 *   1. Android 端 createMessage 的 delay 依赖 app 进程存活，进程被杀后定时失效
 *   2. iOS 端多个 createMessage 会互相覆盖，只显示最近一条 → 队列只保留最近 N 条
 *   3. 真机测试需 HBuilderX 云打包（标准基座/真机运行不支持推送）
 */

// 提醒队列 key：storage 持久化
const REMINDER_QUEUE_KEY = 'know-reminder-queue'
// iOS 最多保留最近注册条数（官方限制多通知覆盖）
const IOS_MAX_PENDING = 3

interface ReminderItem {
    biz: 'schedule' | 'habit' // 业务类型
    bizId: string // 业务主键
    title: string // 通知标题
    content: string // 通知内容
    triggerAt: number // 触发时间戳（ms）
}

/** 读取本地提醒队列 */
const getQueue = (): ReminderItem[] => {
    try {
        return uni.getStorageSync(REMINDER_QUEUE_KEY) || []
    } catch (_e) {
        return []
    }
}

/** 覆盖写入提醒队列 */
const saveQueue = (queue: ReminderItem[]) => {
    try {
        uni.setStorageSync(REMINDER_QUEUE_KEY, queue)
    } catch (_e) {
        // 忽略存储失败
    }
}

/** 计算到触发时刻的延迟秒数（至少 1s，避免立即弹出） */
const calcDelay = (triggerAt: number): number => {
    const diff = Math.round((triggerAt - Date.now()) / 1000)
    return Math.max(diff, 1)
}

/**
 * 在 App 端注册一条系统通知
 * 仅在触发时间晚于当前时间时注册；iOS 端只保留最近 N 条
 */
const notifyOnApp = (item: ReminderItem) => {
    // #ifdef APP-PLUS
    if (item.triggerAt <= Date.now()) return
    // 只对最近期的提醒注册系统通知（iOS 多通知互相覆盖，全部注册无意义）
    const queue = getQueue()
    const pending = queue
        .filter((q) => q.triggerAt > Date.now())
        .sort((a, b) => a.triggerAt - b.triggerAt)
    const recent = pending.slice(0, IOS_MAX_PENDING)
    if (!recent.some((q) => q.biz === item.biz && q.bizId === item.bizId)) return

    try {
        plus.push.createMessage(item.content, JSON.stringify({ biz: item.biz, bizId: item.bizId }), {
            title: item.title,
            cover: false,
            sound: 'system',
            delay: calcDelay(item.triggerAt)
        } as any)
    } catch (e) {
        console.warn('[reminder] createMessage failed', e)
    }
    // #endif
}

/** 把提醒写入队列并在 App 端注册 */
const pushToQueue = (item: ReminderItem) => {
    const queue = getQueue()
    // 同一业务主键去重（更新场景先删旧）
    const filtered = queue.filter((q) => !(q.biz === item.biz && q.bizId === item.bizId))
    filtered.push(item)
    saveQueue(filtered)
    notifyOnApp(item)
}

/**
 * 注册日程提醒
 * @param param.id 日程 id（字符串）
 * @param param.title 日程标题
 * @param param.startTime 开始时间戳（ms）
 * @param param.remindMinutes 提前提醒分钟数（>0 提前，0 准时，<0 不提醒）
 */
export const registerScheduleReminder = (param: {
    id: string | number
    title: string
    startTime: number
    remindMinutes: number
}) => {
    // #ifdef APP-PLUS
    if (!param.startTime || Number(param.remindMinutes) < 0) {
        removeRemindersByBiz('schedule', String(param.id))
        return
    }
    const triggerAt = param.startTime - Number(param.remindMinutes) * 60 * 1000
    pushToQueue({
        biz: 'schedule',
        bizId: String(param.id),
        title: '📅 日程提醒',
        content: param.title || '日程即将开始',
        triggerAt
    })
    // #endif
}

/**
 * 注册习惯每日提醒
 * @param param.id 习惯 id
 * @param param.name 习惯名称
 * @param param.reminderTime 提醒时间 'HH:mm'，空则不提醒
 * @param param.secondReminder 第二提醒 'HH:mm'，空则不设置
 */
export const registerHabitReminder = (param: {
    id: string | number
    name: string
    reminderTime: string
    secondReminder?: string
}) => {
    // #ifdef APP-PLUS
    removeRemindersByBiz('habit', String(param.id))
    if (!param.reminderTime) return
    const todayTimes = param.secondReminder
        ? [param.reminderTime, param.secondReminder]
        : [param.reminderTime]
    todayTimes.forEach((hhmm) => {
        if (!/^\d{1,2}:\d{2}$/.test(hhmm || '')) return
        const [h, m] = hhmm.split(':').map((v) => Number(v))
        const base = new Date()
        base.setHours(h, m, 0, 0)
        // 今日已过则顺延到明天
        if (base.getTime() <= Date.now()) base.setDate(base.getDate() + 1)
        pushToQueue({
            biz: 'habit',
            bizId: String(param.id),
            title: '🎯 习惯提醒',
            content: param.name || '该打卡啦',
            triggerAt: base.getTime()
        })
    })
    // #endif
}

/** 移除某业务类型的提醒（删除/更新时清旧） */
export const removeRemindersByBiz = (biz: 'schedule' | 'habit', bizId: string) => {
    // #ifdef APP-PLUS
    const queue = getQueue().filter((q) => !(q.biz === biz && q.bizId === bizId))
    saveQueue(queue)
    // #endif
}

/** 清理已过期提醒并重新注册最近提醒（App 启动/回到前台时调用） */
export const syncReminders = () => {
    // #ifdef APP-PLUS
    const now = Date.now()
    const queue = getQueue().filter((q) => q.triggerAt > now)
    saveQueue(queue)
    // 过期一条则顺延注册一次习惯提醒（未读情况下每天持续提醒）
    const pending = queue
        .filter((q) => q.triggerAt > now)
        .sort((a, b) => a.triggerAt - b.triggerAt)
    pending.slice(0, IOS_MAX_PENDING).forEach((item) => {
        try {
            plus.push.createMessage(
                item.content,
                JSON.stringify({ biz: item.biz, bizId: item.bizId }),
                {
                    title: item.title,
                    cover: false,
                    sound: 'system',
                    delay: calcDelay(item.triggerAt)
                } as any
            )
        } catch (e) {
            console.warn('[reminder] sync createMessage failed', e)
        }
    })
    // #endif
}
