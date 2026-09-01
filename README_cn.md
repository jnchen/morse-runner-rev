# Morse Runner Web

[English](README.md) · 简体中文

一个受 MorseRunner 启发、现代化、独立、跨平台的 CW 竞赛训练器。
同时支持桌面与移动浏览器，可安装为 PWA，并保持完整的离线可用性。
所有训练与设置数据都保留在本地。

## 当前状态

本项目仍在积极开发中，目前已实现：

- 块驱动的 CW 音频模拟（11025 Hz / 512 采样块）
- Pile-up、Single Calls、WPX 风格与 HST 风格模式
- QRN / QRM / QSB / flutter / lids 模拟
- DX 操作员行为状态机
- 智能 Enter 发送、原版风格键盘快捷键，以及移动端快捷操作栏
- QSO 日志、重复 / NIL / 交换内容检查、WPX 前缀与 HST 计分
- 原版 `MASTER.DTA` 呼号列表上传与 IndexedDB 持久化
- Community Edition 竞赛的 N1MM 风格呼号历史库上传
- 本地训练历史与 QSO 恢复
- ADIF 与 Cabrillo 3.0 导出
- 英文、中文、日文界面
- 可安装的离线 PWA

## 参考与致谢

本项目是独立的 TypeScript 实现，但其行为与竞赛覆盖范围是通过研究公开的
MorseRunner 系列程序实现的。特别感谢：

- [MorseRunner by Alex Shovkoplyas, VE3NEA](https://github.com/VE3NEA/MorseRunner) —— 原始 CW 竞赛模拟器，包括核心 pileup / HST 行为、`MASTER.DTA` 呼号列表格式、操作员流程与键盘模型。
- [Morse Runner Community Edition by W7SST and contributors](https://github.com/w7sst/MorseRunner) —— Community Edition 竞赛支持、N1MM 风格呼号历史库行为，以及 CWT、Field Day、NAQP、CQ WW、ARRL DX、SST、JARL ALL JA / ACAG、IARU HF 的相关文档。
- [BH1SCW's MorseRunner branch](https://github.com/BH1SCW/MorseRunner) —— Community Edition 历史中引用的 Unicode 与导出相关增强。
- [F6FVY's MorseRunner branch](https://github.com/f6fvy/MorseRunner) —— Community Edition 历史中引用的呼叫流程与 RIT / 呼号查询改进。
- [N2IC's MorseRunner branch](https://github.com/N2IC/MorseRunner) —— Community Edition 历史中引用的 CQ WW 支持与集成相关修复。
- [JR8PPG's MorseRunnerJA branch](https://github.com/JR8PPG/MorseRunner) —— JARL ALL JA 与 ACAG 竞赛行为。
- [zmetzing's Linux port](https://github.com/zmetzing/MorseRunner) —— 证明原版 1.68 模拟模型可以移植到 Delphi / Windows 之外。

感谢 VE3NEA 创造 MorseRunner，也感谢所有 MorseRunner 维护者、竞赛开发者、
测试者与 CW 操作者多年以来记录其行为。他们的已发布程序与公开笔记被用作行为参考；
本仓库不再分发他们的源代码或数据文件。

## 在线版本

最新 `master` 构建会自动部署到 GitHub Pages：

<https://jnchen.github.io/morse-runner-rev/>

## 本地优先策略

应用不需要账号、后端或网络访问。设置与导入的数据都保留在浏览器中。

可选在线功能位于独立仓库：

```text
morse-runner-web-plugin
morse-runner-server
```

本仓库运行时不依赖以上任何一个项目。

## 法律说明

本仓库包含独立的 TypeScript 实现，不包含或派生自原 MorseRunner 项目的
MPL-2.0 源文件。项目以 MIT License 发布。见 `LICENSE` 与 `NOTICE`。

## 开发

```bash
npm install
npm run dev
```

## 安装为应用

生产构建是 Progressive Web App。通过 HTTPS 或 localhost 访问后，使用浏览器的
**安装** 功能（iOS 上为 **添加到主屏幕**）。首次访问后，训练界面与本地数据可离线使用。

## 构建

```bash
npm run build
npm run preview
```

## 验证修改

```bash
npm run check
```

该命令会执行 lint、测试与生产构建。

## Community Edition 竞赛数据

应用支持 Community Edition 竞赛定义与本地呼号历史库上传，例如 `CWOPS.LIST`、
`CQWWCW.txt`、`FDGOTA.txt` 与 `SSCW.txt`。上传的历史库文件与本地训练结果保存在
浏览器 IndexedDB 中，不会打包进应用，也不会发送到在线服务。对没有专用历史库文件的
竞赛，`MASTER.DTA` 仍作为后备呼号池。
