import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_STATE,
  PERMISSION,
  POINT_KIND,
  REPORT_STATE,
  TEXTURE_STATE,
  TEXTURE_TYPE,
  accountStateLabel,
  accountStateTone,
  auditActionLabel,
  auditResultLabel,
  permissionLabel,
  permissionTone,
  pluginActionLabel,
  pointKindLabel,
  pointKindTone,
  reportStateTone,
  textureStateTone,
  textureTypeLabel,
  textureTypeTone,
} from './enums'

describe('材质类型映射', () => {
  it('0/1/2 对应 Steve/Alex/披风与徽章色', () => {
    expect(textureTypeLabel(TEXTURE_TYPE.STEVE)).toBe('Steve')
    expect(textureTypeLabel(TEXTURE_TYPE.ALEX)).toBe('Alex')
    expect(textureTypeLabel(TEXTURE_TYPE.CAPE)).toBe('披风')
    expect(textureTypeTone(TEXTURE_TYPE.ALEX)).toBe('alex')
  })

  it('未知取值回退到未知文案', () => {
    expect(textureTypeLabel(9)).toBe('未知')
    expect(textureTypeTone(9)).toBe('muted')
  })
})

describe('状态与权限映射', () => {
  it('材质下架用危险色', () => {
    expect(textureStateTone(TEXTURE_STATE.ACTIVE)).toBe('ok')
    expect(textureStateTone(TEXTURE_STATE.HIDDEN)).toBe('danger')
  })

  it('账号状态与权限文案', () => {
    expect(accountStateLabel(ACCOUNT_STATE.ACTIVE)).toBe('正常')
    expect(accountStateLabel(ACCOUNT_STATE.BANNED)).toBe('已封禁')
    expect(accountStateTone(ACCOUNT_STATE.DELETED)).toBe('muted')
    expect(permissionLabel(PERMISSION.OWNER)).toBe('站点所有者')
    expect(permissionTone(PERMISSION.ADMIN)).toBe('lapis')
  })

  it('举报状态色与审计标签', () => {
    expect(reportStateTone(REPORT_STATE.PENDING)).toBe('warn')
    expect(reportStateTone(REPORT_STATE.RESOLVED)).toBe('ok')
    expect(auditActionLabel(3)).toBe('举报处理')
    expect(auditActionLabel(7)).toBe('外部身份解绑')
    expect(auditResultLabel(-1)).toBe('未改动')
    expect(auditResultLabel(1)).toBe('已驳回')
  })

  it('积分来源与插件动作标签', () => {
    expect(pointKindLabel(POINT_KIND.SIGN)).toBe('签到')
    expect(pointKindLabel(POINT_KIND.PRIVACY)).toBe('转私有补差价')
    expect(pointKindTone(POINT_KIND.PRIVACY)).toBe('warn')
    expect(pluginActionLabel('texture.upload')).toBe('材质上传')
    expect(pluginActionLabel('unknown.action')).toBe('unknown.action')
  })
})
