<template>
    <page-meta page-style="background: var(--color-bg)">
        <!-- #ifndef H5 -->
        <navigation-bar front-color="var(--color-text)" background-color="var(--color-bg)" />
        <!-- #endif -->
    </page-meta>
    <view class="login-wrap">
        <view class="bg-orbs"></view>
        <view class="toast" :class="{ show: toastMessage }">{{ toastMessage }}</view>

        <view class="theme-top">
            <ThemeSwitcher />
        </view>

        <view class="login-container" :class="{ compact: isCompact }" :style="containerStyle">
            <view class="logo-wrap" :class="{ compact: isCompact }">
                <image src="/static/images/logo.png" class="logo-image" mode="aspectFit" />
                <text class="logo-name" v-if="showLogoName">{{ websiteConfig.shop_name || '喵百科' }}</text>
                <text class="logo-desc">智能管理，触手可及</text>
            </view>

            <view class="card-glass">
                <view class="login-tabs">
                    <view
                        class="tab-item"
                        :class="{ active: formData.scene === LoginWayEnum.ACCOUNT }"
                        @tap="changeLoginWay(LoginWayEnum.ACCOUNT)"
                        >密码登录</view
                    >
                    <view
                        class="tab-item"
                        :class="{ active: formData.scene === LoginWayEnum.MOBILE }"
                        @tap="changeLoginWay(LoginWayEnum.MOBILE)"
                        >短信登录</view
                    >
                </view>

                <view v-if="formData.scene === LoginWayEnum.ACCOUNT">
                    <view class="form-group">
                        <text class="form-label">账号</text>
                        <view class="input-wrap">
                            <text class="input-prefix">👤</text>
                            <input
                                v-model="formData.account"
                                class="native-input"
                                type="text"
                                placeholder="手机号、用户名或邮箱"
                            />
                        </view>
                    </view>

                    <view class="form-group">
                        <text class="form-label">密码</text>
                        <view class="input-wrap">
                            <text class="input-prefix">🔒</text>
                            <input
                                v-model="formData.password"
                                class="native-input has-toggle"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="输入密码"
                            />
                            <button class="toggle-pass" @tap="showPassword = !showPassword">
                                {{ showPassword ? '🙈' : '👁️' }}
                            </button>
                        </view>
                    </view>

                    <view class="extras">
                        <label class="remember" @tap="rememberLogin = !rememberLogin">
                            <checkbox :checked="rememberLogin" color="var(--color-primary)" />
                            <text>记住登录</text>
                        </label>
                        <navigator
                            url="/pages/forget_pwd/forget_pwd"
                            hover-class="none"
                            class="forgot"
                            >忘记密码?</navigator
                        >
                    </view>
                </view>

                <view v-if="formData.scene === LoginWayEnum.MOBILE">
                    <view class="form-group">
                        <text class="form-label">手机号</text>
                        <view class="input-wrap">
                            <text class="input-prefix">📱</text>
                            <input
                                v-model="formData.account"
                                class="native-input"
                                type="tel"
                                placeholder="手机号"
                            />
                        </view>
                    </view>

                    <view class="form-group">
                        <text class="form-label">验证码</text>
                        <view class="input-code-wrap">
                            <view class="input-code-flex input-wrap">
                                <input
                                    v-model="formData.code"
                                    class="native-input no-prefix"
                                    type="text"
                                    placeholder="6位验证码"
                                />
                            </view>
                            <view
                                class="btn-code-send"
                                @tap="formData.account ? sendSms() : undefined"
                            >
                                <u-verification-code
                                    ref="uCodeRef"
                                    :seconds="60"
                                    @change="codeChange"
                                    change-text="x秒"
                                />
                                <text
                                    :style="{
                                        color: formData.account
                                            ? 'var(--color-primary)'
                                            : 'var(--color-text-tertiary)'
                                    }"
                                    >{{ codeTips }}</text
                                >
                            </view>
                        </view>
                    </view>
                </view>

                <view class="agreement-row" v-if="isOpenAgreement">
                    <label class="agree-check">
                        <u-checkbox
                            v-model="isCheckAgreement"
                            shape="circle"
                            :active-color="themeStore.primaryColor || '#6366f1'"
                        >
                            <text class="agree-text">已阅读并同意</text>
                        </u-checkbox>
                    </label>
                    <view class="agree-links">
                        <navigator
                            hover-class="none"
                            url="/pages/agreement/agreement?type=service"
                            class="agree-link"
                            >《服务协议》</navigator
                        >
                        <text class="agree-and">和</text>
                        <navigator
                            hover-class="none"
                            url="/pages/agreement/agreement?type=privacy"
                            class="agree-link"
                            >《隐私协议》</navigator
                        >
                    </view>
                </view>

                <view
                    class="btn-primary btn-login"
                    @tap="handleLogin(formData.scene)"
                    :style="{ opacity: DisableStyle ? '1' : '0.5' }"
                    >登录</view
                >

                <view class="social-divider">
                    <text>其他登录方式</text>
                </view>

                <view class="social-icons">
                    <view class="social-btn wechat" title="微信登录" @tap="handleWechatLogin">
                        <view class="social-svg" v-html="wechatIcon"></view>
                    </view>
                    <view class="social-btn qq" title="QQ登录" @tap="showToast('QQ 登录暂未开放')">
                        <view class="social-svg" v-html="qqIcon"></view>
                    </view>
                    <view
                        class="social-btn phone"
                        title="本机号码登录"
                        @tap="showToast('本机号码登录暂未开放')"
                    >
                        <view class="social-svg" v-html="phoneIcon"></view>
                    </view>
                </view>

                <view class="signup-link">
                    <text>还没有账号？</text>
                    <navigator
                        url="/pages/register/register"
                        hover-class="none"
                        class="signup-link-text"
                        >立即注册</navigator
                    >
                </view>
            </view>
        </view>

        <u-modal
            v-model="showModel"
            show-cancel-button
            :show-title="false"
            confirm-color="var(--color-primary, #6366f1)"
            @confirm=";(isCheckAgreement = true), (showModel = false)"
            @cancel="showModel = false"
        >
            <view class="text-center px-[35px] py-[30px]">
                <view class="text-3xl mb-[10px]" style="color: var(--color-text)">📋</view>
                <view class="text-[15px] mb-[8px]" style="color: var(--color-text)"
                    >请先阅读并同意</view
                >
                <view class="flex justify-center items-center gap-[4px]">
                    <navigator
                        data-theme=""
                        url="/pages/agreement/agreement?type=service"
                        hover-class="none"
                    >
                        <text style="color: var(--color-primary)">《服务协议》</text>
                    </navigator>
                    <text style="color: var(--color-text-tertiary)">和</text>
                    <navigator url="/pages/agreement/agreement?type=privacy" hover-class="none">
                        <text style="color: var(--color-primary)">《隐私协议》</text>
                    </navigator>
                </view>
            </view>
        </u-modal>

        <!-- #ifdef MP-WEIXIN -->
        <mplogin-popup
            v-model:show="showLoginPopup"
            :logo="websiteConfig.shop_logo || '/static/images/logo.png'"
            :title="websiteConfig.shop_name || '喵百科'"
            @update="handleUpdateUser"
        />
        <!--  #endif -->
    </view>
</template>

<script setup lang="ts">
import { login, mnpLogin, updateUser, OALogin } from '@/api/account'
import { smsSend } from '@/api/app'
import { SMSEnum } from '@/enums/appEnums'
import { BACK_URL } from '@/enums/constantEnums'
import { setToken } from '@/api/auth'
import { useLockFn } from '@/hooks/useLockFn'
import { useAppStore } from '@/stores/app'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'uniapp-router-next'
import ThemeSwitcher from '@/components/widgets/ThemeSwitcher.vue'
import cache from '@/utils/cache'
import { isWeixinClient } from '@/utils/client'
// #ifdef H5
import wechatOa, { UrlScene } from '@/utils/wechat'
// #endif
import { getRect } from '@/utils/util'
import { onLoad, onReady, onUnload } from '@dcloudio/uni-app'
import { computed, nextTick, reactive, ref, shallowRef, watch } from 'vue'

enum LoginWayEnum {
    ACCOUNT = 1,
    MOBILE = 2
}

const isWeixin = ref(true)
// #ifdef H5
isWeixin.value = isWeixinClient()
// #endif

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()
const themeStore = useThemeStore()
const showModel = ref(false)
const uCodeRef = shallowRef()
const codeTips = ref('')
const showLoginPopup = ref(false)
const isCheckAgreement = ref(false)
const showPassword = ref(false)
const rememberLogin = ref(true)
const toastMessage = ref('')

// 一屏适配：优先实测真实渲染高度动态缩放，测量失败时回退到按窗口高度推算
const sysInfo = uni.getSystemInfoSync()
const windowHeight = ref(sysInfo.windowHeight || 0)
// 状态栏高度：App 端自定义导航栏布局需要避开状态栏
const statusBarHeight = sysInfo.statusBarHeight || 0
// 底部安全区（iPhone home indicator 等）
const safeAreaBottom = sysInfo.safeAreaInsets?.bottom || 0

// 实测状态：wrapH=登录容器实际高度，cardH=卡片自然高度（未缩放），
// measuring=true 时 containerStyle 返回 {}（清除 transform），避免量到缩放后的尺寸
const wrapH = ref(0)
const cardH = ref(0)
const measured = ref(false)
const measuring = ref(false)
let measuringInFlight = false

// 一屏适配核心：根据实测高度动态缩放整个登录卡片，保证任何屏幕一屏完整显示
const containerStyle = computed(() => {
    // 测量过程中必须先清除 transform，否则 boundingClientRect 返回缩放后尺寸导致二次缩放偏差
    if (measuring.value) return {}
    if (measured.value && cardH.value > 0) {
        // 可用高度：容器实测高度扣除上下留白（各 12px）
        const avail = wrapH.value - 24
        const ratio = Math.min(1, Math.max(0.55, avail / cardH.value))
        return {
            transform: `scale(${ratio})`,
            transformOrigin: 'center center'
        }
    }
    // 兜底回退：测量失败时沿用旧的窗口高度推算公式
    const BASE = isCompact.value ? 620 : 700
    const avail = windowHeight.value - (statusBarHeight || 0) - safeAreaBottom - 30
    if (!avail || avail <= 0) return {}
    const ratio = Math.min(1, Math.max(0.7, avail / BASE))
    return {
        transform: `scale(${ratio})`,
        transformOrigin: 'center center'
    }
})
// 窗口高度过小时进入紧凑模式（缩小 logo、压缩间距）
// 优先用实测 wrapH（App 端 windowHeight 可能偏大导致紧凑模式不生效）
const isCompact = computed(() => {
    const effectiveH = measured.value ? wrapH.value : windowHeight.value
    return effectiveH > 0 && effectiveH < 720
})
// 隐藏 logo 下方的"喵百科"文字，保证登录卡片完整一屏（全平台隐藏）
const showLogoName = computed(() => false)

// 实测协议：清除 transform -> nextTick 等重渲染 -> 量取自然高度
const measure = async () => {
    if (measuringInFlight) return
    measuringInFlight = true
    measuring.value = true
    await nextTick()
    try {
        const wrap = (await getRect('.login-wrap')) as any
        const card = (await getRect('.login-container')) as any
        wrapH.value = wrap?.height ?? 0
        cardH.value = card?.height ?? 0
        measured.value = cardH.value > 0
    } catch {
        // 测量失败：保持 measured=false，走旧公式兜底
        measured.value = false
    } finally {
        measuring.value = false
        measuringInFlight = false
    }
}

onReady(() => {
    measure()
    uni.onWindowResize(measure)
})
onUnload(() => {
    uni.offWindowResize(measure)
})

const formData = reactive({
    scene: 1,
    account: '',
    password: '',
    code: ''
})
const loginData = ref()

const websiteConfig = computed(() => appStore.getWebsiteConfig)

const wechatIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8 18c-3.314 0-6-2.462-6-5.5C2 9.462 4.686 7 8 7s6 2.462 6 5.5S11.314 18 8 18z"></path>
  <path d="M6 18l-1.5 2 .5-2.5"></path>
  <path d="M16.5 17C19.538 17 22 14.986 22 12.5S19.538 8 16.5 8c-2.166 0-4.038 1.02-4.94 2.5"></path>
</svg>
`

const qqIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
  <path d="M12 2.8c2.74 0 4.74 2.22 4.74 5.6 0 1.34-.27 2.54-.74 3.52.53.54.9 1.22 1.05 2.02.16.83.08 1.56-.24 2.18-.22.43-.58.77-1.05 1 .08.39.12.8.12 1.22 0 1.19-.34 2.02-1.02 2.5-.41.29-.93.43-1.56.43-.85 0-1.6-.31-2.24-.94-.64.63-1.39.94-2.24.94-.63 0-1.15-.14-1.56-.43-.68-.48-1.02-1.31-1.02-2.5 0-.42.04-.83.12-1.22-.47-.23-.83-.57-1.05-1-.32-.62-.4-1.35-.24-2.18.15-.8.52-1.48 1.05-2.02-.47-.98-.74-2.18-.74-3.52 0-3.38 2-5.6 4.74-5.6Z"></path>
</svg>
`

const phoneIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="7" y="2.5" width="10" height="19" rx="2.2"></rect>
  <line x1="11" y1="5.5" x2="13" y2="5.5"></line>
  <circle cx="12" cy="18" r="0.8" fill="currentColor" stroke="none"></circle>
</svg>
`

const codeChange = (text: string) => {
    codeTips.value = text
}

const showToast = (message: string) => {
    toastMessage.value = message
    setTimeout(() => {
        toastMessage.value = ''
    }, 2200)
}

const sendSms = async () => {
    if (!formData.account) return
    if (uCodeRef.value?.canGetCode) {
        await smsSend({
            scene: SMSEnum.LOGIN,
            mobile: formData.account
        })
        uni.$u.toast('发送成功')
        showToast('验证码已发送')
        uCodeRef.value?.start()
    }
}

const changeLoginWay = (way: LoginWayEnum) => {
    formData.scene = way
}

const includeLoginWay = (way: LoginWayEnum) => {
    return appStore.getLoginConfig.login_way?.includes(String(way))
}

const inWxAuth = computed(() => appStore.getLoginConfig.wechat_auth)
const isOpenAgreement = computed(() => appStore.getLoginConfig.login_agreement == 1)
const isOpenOtherAuth = computed(() => appStore.getLoginConfig.third_auth == 1)
const isForceBindMobile = computed(() => appStore.getLoginConfig.coerce_mobile == 1)

const loginFun = async () => {
    if (!isCheckAgreement.value && isOpenAgreement.value) return (showModel.value = true)
    if (formData.scene == LoginWayEnum.ACCOUNT) {
        if (!formData.account) return uni.$u.toast('请输入账号/手机号')
        if (!formData.password) return uni.$u.toast('请输入密码')
    }
    if (formData.scene == LoginWayEnum.MOBILE) {
        if (!formData.account) return uni.$u.toast('请输入手机号')
        if (!formData.code) return uni.$u.toast('请输入验证码')
    }
    uni.showLoading({
        title: '请稍候...'
    })
    try {
        const data = await login(formData)
        await loginHandle(data)
    } catch (error: any) {
        uni.hideLoading()
        uni.$u.toast(error)
    }
}

const loginHandle = async (data: any) => {
    const { token, mobile } = data
    if (!mobile && isForceBindMobile.value) {
        userStore.temToken = token
        router.navigateTo('/pages/bind_mobile/bind_mobile')
        uni.hideLoading()
        return
    }
    userStore.token = data.token
    userStore.tokenName = data.tokenName || 'token'
    setToken(data.token, userStore.tokenName)
    try {
        await userStore.getUser()
    } catch (e) {
        console.warn('getUserInfo失败，不影响登录', e)
    }
    await appStore.loadUserMenuConfig()
    uni.$u.toast('登录成功')
    showToast('欢迎回来')
    uni.hideLoading()
    const pages = getCurrentPages()
    if (pages.length > 1) {
        const prevPage = pages[pages.length - 2]
        await router.navigateBack()
        // @ts-ignore
        const { onLoad, options } = prevPage
        onLoad && onLoad(options)
    } else if (cache.get(BACK_URL)) {
        try {
            // #ifdef APP-PLUS
            router.reLaunch(cache.get(BACK_URL))
            // #endif
            // #ifndef APP-PLUS
            router.switchTab(cache.get(BACK_URL))
            // #endif
        } catch (error) {
            router.redirectTo(cache.get(BACK_URL))
        }
    } else {
        // #ifdef APP-PLUS
        router.reLaunch('/pages/index/index')
        // #endif
        // #ifndef APP-PLUS
        router.switchTab('/pages/index/index')
        // #endif
    }
    cache.remove(BACK_URL)
}

const { lockFn: handleLogin } = useLockFn(loginFun)

const oaLogin = async (options: any = { getUrl: true }) => {
    const { code, getUrl } = options
    if (getUrl) {
        await wechatOa.getUrl(UrlScene.LOGIN)
    } else {
        const data = await OALogin({ code })
        return data
    }
    return Promise.reject()
}

const wxLogin = async () => {
    if (!isCheckAgreement.value && isOpenAgreement.value) {
        showModel.value = true
        return
    }

    // #ifdef MP-WEIXIN
    uni.showLoading({
        title: '请稍候...'
    })
    try {
        const { code }: any = await uni.login({
            provider: 'weixin'
        })
        const data = await mnpLogin({ code })
        loginData.value = data
        if (data.is_new_user) {
            uni.hideLoading()
            userStore.temToken = data.token
            showLoginPopup.value = true
            return
        }
        loginHandle(data)
    } catch (error: any) {
        uni.hideLoading()
        uni.$u.toast(error)
    }
    // #endif

    // #ifdef H5
    if (isWeixin.value) {
        oaLogin()
    }
    // #endif
}

const handleWechatLogin = async () => {
    if (isOpenOtherAuth.value && ((isWeixin.value && inWxAuth.value) || !isWeixin.value)) {
        await wxLogin()
        return
    }
    showToast('当前环境暂不支持微信登录')
}

const handleUpdateUser = async (value: any) => {
    await updateUser(value, { token: userStore.temToken })
    showLoginPopup.value = false
    loginHandle(loginData.value)
}

watch(
    () => appStore.getLoginConfig,
    (value) => {
        if (value.login_way) {
            formData.scene = value.login_way[0]
        }
    },
    {
        immediate: true
    }
)

const DisableStyle = computed(() => {
    if (formData.scene == 1 && formData.account && formData.password) {
        return true
    } else if (formData.scene == 2 && formData.account && formData.code) {
        return true
    } else {
        return false
    }
})

const removeWxQuery = () => {
    const options = route.query
    if (options.code && options.state) {
        delete options.code
        delete options.state
        router.redirectTo({ path: route.path, query: options })
    }
}

onLoad(async () => {
    //#ifdef H5
    const options = wechatOa.getAuthData()
    try {
        if (options.code && options.scene === UrlScene.LOGIN) {
            uni.showLoading({
                title: '请稍候...'
            })
            const data = await oaLogin(options)
            if (data) {
                loginData.value = data
                loginHandle(loginData.value)
            }
        }
    } catch (error) {
        removeWxQuery()
    } finally {
        uni.hideLoading()
        wechatOa.setAuthData()
    }
    //#endif
})
</script>

<style lang="scss">
.login-wrap {
    // 固定一屏高度，禁止滚动
    height: 100vh;
    /* #ifdef H5 */
    // H5 端使用动态视口高度，适配移动浏览器地址栏伸缩
    height: 100dvh;
    /* #endif */
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background: var(--color-bg-app);
    position: relative;
    box-sizing: border-box;
    /* #ifdef APP-PLUS */
    // App 端避免底部安全区（home indicator）遮挡
    padding-bottom: env(safe-area-inset-bottom);
    /* #endif */
}

.bg-orbs {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    z-index: 0;
}

.bg-orbs::before,
.bg-orbs::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    animation: drifting 10s ease-in-out infinite alternate;
}

.bg-orbs::before {
    width: 550px;
    height: 550px;
    background: radial-gradient(
        circle,
        rgba(var(--color-primary-rgb), 0.35),
        var(--color-bg-app) 70%
    );
    top: -15%;
    left: -12%;
}

.bg-orbs::after {
    width: 450px;
    height: 450px;
    background: radial-gradient(
        circle,
        rgba(var(--color-primary-rgb), 0.25),
        var(--color-bg-app) 70%
    );
    bottom: -12%;
    right: -12%;
    animation-delay: -5s;
}

@keyframes drifting {
    0% {
        transform: translate(0, 0) scale(1);
    }
    100% {
        transform: translate(50px, 40px) scale(1.12);
    }
}

.toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(-80px);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 14px 28px;
    color: var(--color-text);
    font-size: 14px;
    z-index: 100;
    opacity: 0;
    transition: all 0.5s var(--ease);
    pointer-events: none;
    font-weight: 500;
}

.toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.login-container {
    position: relative;
    z-index: 1;
    width: 400px;
    max-width: 92vw;
    padding: 24px 0;
    // 垂直居中：父容器 flex 居中，transform scale 仅做视觉缩放不影响居中
    display: flex;
    flex-direction: column;
    align-items: center;
    will-change: transform;

    // 紧凑模式（小屏设备）：压缩各区块间距，保证登录卡片一屏完整展示
    &.compact {
        padding: 10px 0;

        .logo-wrap {
            margin-bottom: 14px;
        }

        .logo-image {
            width: 50px;
            height: 50px;
            margin-bottom: 8px;
            border-radius: 14px;
        }

        .logo-desc {
            font-size: 12px;
            margin-top: 2px;
        }

        .card-glass {
            padding: 20px 24px 18px;
        }

        .login-tabs {
            margin-bottom: 16px;
        }

        .form-group {
            margin-bottom: 12px;
        }

        .form-label {
            margin-bottom: 6px;
        }

        .native-input {
            padding-top: 11px;
            padding-bottom: 11px;
        }

        .btn-code-send {
            padding: 11px 16px;
        }

        .extras {
            margin: 12px 0 4px;
        }

        .agreement-row {
            margin: 6px 0 8px;
        }

        .btn-login {
            padding: 12px;
        }

        .social-divider {
            margin: 14px 0 12px;
        }

        .social-btn {
            width: 44px;
            height: 44px;
        }

        .signup-link {
            margin-top: 10px;
        }
    }
}

.theme-top {
    position: fixed;
    top: calc(10px + var(--status-bar-height));
    right: 14px;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.logo-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 44px;
}

.logo-image {
    width: 76px;
    height: 76px;
    border-radius: 20px;
    margin-bottom: 18px;
    box-shadow: 0 10px 36px rgba(var(--color-primary-rgb), 0.25);
}

.logo-name {
    display: block;
    font-size: 26px;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: -0.02em;
    line-height: 1.2;
}

.logo-desc {
    display: block;
    font-size: 14px;
    color: var(--color-text-secondary);
    margin-top: 6px;
    line-height: 1.4;
}

.card-glass {
    width: 100%;
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    border: 1px solid var(--color-border);
    padding: 36px 28px 32px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
}

.login-tabs {
    display: flex;
    gap: 28px;
    margin-bottom: 34px;
    border-bottom: 1px solid var(--color-border);
}

.tab-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text-tertiary);
    padding-bottom: 14px;
    position: relative;
    line-height: 1.2;
}

.tab-item.active {
    color: var(--color-text);
}

.tab-item.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--color-primary), #e8499d);
    border-radius: 2px;
}

.form-group {
    margin-bottom: 22px;
}

.form-label {
    display: block;
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin-bottom: 8px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
}

.input-wrap {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: all var(--duration) var(--ease);
}

.input-wrap:focus-within {
    border-color: var(--color-primary);
    background: var(--color-primary-mist);
    box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.08);
}

.input-prefix {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: var(--color-text-tertiary);
    pointer-events: none;
    z-index: 2;
}

.native-input {
    width: 100%;
    padding: 17px 18px 17px 50px;
    background: transparent;
    border: none;
    outline: none;
    font-size: 15px;
    color: var(--color-text);
    font-family: inherit;
}

.native-input::placeholder {
    color: var(--color-text-tertiary);
}

.native-input.has-toggle {
    padding-right: 52px;
}

.native-input.no-prefix {
    padding-left: 18px;
}

.toggle-pass {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--color-text-tertiary);
    font-size: 18px;
    padding: 4px;
    line-height: 1;
}

:deep(.u-verification-code) {
    background: transparent !important;
}

.input-code-wrap {
    display: flex;
    gap: 12px;
}

.input-code-flex {
    flex: 1;
}

.btn-code-send {
    flex-shrink: 0;
    padding: 17px 20px;
    background: var(--color-surface-soft);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 14px;
    white-space: nowrap;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
}

.extras {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 26px 0 10px;
}

.remember {
    display: flex;
    align-items: center;
    gap: 8px;
}

.remember text {
    font-size: 13px;
    color: var(--color-text-tertiary);
}

.forgot {
    font-size: 13px;
    color: rgba(var(--color-primary-rgb), 0.6);
    font-weight: 500;
}

.agreement-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin: 14px 0 12px;
}

.agree-text {
    font-size: 12px;
    color: var(--color-text-secondary);
}

.agree-links {
    display: flex;
    align-items: center;
    gap: 4px;
}

.agree-link {
    font-size: 12px;
    color: rgba(var(--color-primary-rgb), 0.8);
}

.agree-and {
    font-size: 12px;
    color: var(--color-text-tertiary);
}

.btn-login {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 17px;
    border: none;
    border-radius: var(--radius-md);
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, var(--color-primary), #8980f0);
    box-shadow: 0 10px 28px rgba(var(--color-primary-rgb), 0.3);
    letter-spacing: 0.04em;
}

.social-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 30px 0 22px;
}

.social-divider::before,
.social-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
}

.social-divider text {
    font-size: 12px;
    color: var(--color-text-tertiary);
    white-space: nowrap;
}

.social-icons {
    display: flex;
    justify-content: center;
    gap: 14px;
}

.social-btn {
    width: 54px;
    height: 54px;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
}

.social-svg {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

:deep(.social-svg svg) {
    display: block;
    width: 24px;
    height: 24px;
}

.social-btn.wechat {
    color: #07c160;
}
.social-btn.qq {
    color: #12b7f5;
}
.social-btn.phone {
    color: var(--color-primary);
}

.signup-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 26px;
    font-size: 14px;
    color: var(--color-text-tertiary);
}

.signup-link-text {
    display: inline-flex;
    color: rgba(var(--color-primary-rgb), 0.7);
    font-weight: 500;
}

:deep(.u-mode__box) {
    background: var(--color-surface) !important;
    border-radius: 20px !important;
}

:deep(.u-mode__box .u-btn--primary) {
    background: var(--color-primary) !important;
}
</style>
