import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8 bg-card-light dark:bg-card-dark">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <p className="text-4xl font-extrabold text-primary-600 dark:text-primary-500 sm:text-5xl">404</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-secondary-200 dark:sm:border-secondary-700 sm:pl-6">
              <h1 className="text-4xl font-extrabold text-secondary-900 dark:text-secondary-100 tracking-tight sm:text-5xl">
                页面未找到
              </h1>
              <p className="mt-3 text-base text-secondary-500 dark:text-secondary-400">
                抱歉，我们找不到您请求的页面。
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm dark:bg-secondary-800 text-secondary-700  bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                返回首页
              </Link>
              <Link
                href="/library"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 dark:text-primary-200 bg-primary-100 dark:bg-secondary-800 hover:bg-primary-200 dark:hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                浏览书库
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 