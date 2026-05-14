import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  FileArchive,
  Puzzle,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react';

const extensionRelease = {
  name: '天选OS Chrome 浏览器插件',
  version: 'v0.1.0',
  updatedAt: '2026-05-14',
  fileName: 'yzschros-chrome-extension.zip',
  href: '/downloads/yzschros-chrome-extension.zip',
  size: '约 70 KB',
  notes: [
    '支持在招聘网站页面采集候选人基础信息和页面文本。',
    '插件设置中可配置 API 地址和访问令牌。',
    '采集数据进入导入暂存区，需复核后再进入正式人才库。',
  ],
};

const installSteps = [
  '下载并解压插件 zip 文件。',
  '打开 Chrome 地址栏 chrome://extensions。',
  '开启右上角开发者模式。',
  '点击“加载已解压的扩展程序”，选择解压后的 dist 目录。',
  '打开插件设置，填写生产 API 地址和访问令牌。',
];

export default function DownloadsPage() {
  return (
    <main className="min-h-screen bg-bg-base text-text-main">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:py-10">
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-text-sub transition-colors hover:text-text-main"
          >
            <ArrowLeft size={16} />
            返回登录
          </Link>
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="pt-4">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
              <Puzzle size={14} />
              插件下载中心
            </div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-normal text-text-main sm:text-4xl">
              {extensionRelease.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-text-sub">
              面向顾问的数据采集插件。后续版本更新、安装说明和发布说明都会集中维护在这里，测试环境和生产环境都可以按版本下载。
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={extensionRelease.href}
                download
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-brand-primary px-5 text-sm font-semibold text-[#10151f] transition-colors hover:bg-white"
              >
                <Download size={18} />
                下载插件
              </a>
              <a
                href="#install"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border-subtle px-5 text-sm font-medium text-text-main transition-colors hover:border-brand-primary/40 hover:bg-bg-surface"
              >
                查看安装步骤
              </a>
            </div>
          </div>

          <aside className="rounded-lg border border-border-subtle bg-bg-surface p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-primary/12 text-brand-primary">
                <FileArchive size={22} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-main">当前发布版本</h2>
                <p className="mt-1 text-xs text-text-sub">{extensionRelease.fileName}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border-subtle bg-bg-base p-3">
                <dt className="text-xs text-text-sub">版本</dt>
                <dd className="mt-1 font-semibold text-text-main">{extensionRelease.version}</dd>
              </div>
              <div className="rounded-md border border-border-subtle bg-bg-base p-3">
                <dt className="text-xs text-text-sub">大小</dt>
                <dd className="mt-1 font-semibold text-text-main">{extensionRelease.size}</dd>
              </div>
              <div className="col-span-2 rounded-md border border-border-subtle bg-bg-base p-3">
                <dt className="text-xs text-text-sub">更新时间</dt>
                <dd className="mt-1 font-semibold text-text-main">{extensionRelease.updatedAt}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-5">
            <BadgeCheck className="text-brand-primary" size={22} />
            <h2 className="mt-4 text-base font-semibold text-text-main">受控导入</h2>
            <p className="mt-2 text-sm leading-6 text-text-sub">
              插件采集结果先进入导入暂存区，团队复核后再提升为正式候选人，避免污染人才库。
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-5">
            <ShieldCheck className="text-brand-primary" size={22} />
            <h2 className="mt-4 text-base font-semibold text-text-main">本地令牌</h2>
            <p className="mt-2 text-sm leading-6 text-text-sub">
              访问令牌只保存在浏览器本地存储中，重新安装或更换设备后需要重新配置。
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-5">
            <RefreshCcw className="text-brand-primary" size={22} />
            <h2 className="mt-4 text-base font-semibold text-text-main">版本迭代</h2>
            <p className="mt-2 text-sm leading-6 text-text-sub">
              后续设计和功能更新会在此页更新版本号、发布时间、安装包和变更说明。
            </p>
          </div>
        </section>

        <section id="install" className="rounded-lg border border-border-subtle bg-bg-surface p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-main">安装步骤</h2>
              <p className="mt-1 text-sm text-text-sub">当前版本使用 Chrome 开发者模式安装。</p>
            </div>
            <span className="text-xs text-text-sub">适用于 Chrome / Edge Chromium</span>
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-2">
            {installSteps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-md border border-border-subtle bg-bg-base p-4 text-sm leading-6 text-text-sub">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/12 text-xs font-semibold text-brand-primary">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-lg border border-border-subtle bg-bg-surface p-5">
          <h2 className="text-xl font-semibold text-text-main">更新说明</h2>
          <ul className="mt-4 space-y-3">
            {extensionRelease.notes.map((note) => (
              <li key={note} className="flex gap-3 text-sm leading-6 text-text-sub">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
