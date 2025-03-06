import Link from 'next/link';
import { books } from './data/books';
import BookCard from './components/BookCard';
import HeroImage from './components/HeroImage';

export default function Home() {
  // 获取包法利夫人和其他两本精选书籍
  const madameBoavary = books.find(book => book.id === '7'); // 包法利夫人ID为7
  const otherBooks = books.filter(book => book.id !== '7').slice(0, 2); // 其他两本书
  const featuredBooks = madameBoavary ? [madameBoavary, ...otherBooks] : books.slice(0, 3);

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent/20 dark:from-primary-900/30 dark:to-accent/30"></div>
        <div className="absolute inset-0">
          <svg className="absolute left-full transform -translate-y-3/4 -translate-x-1/4 sm:left-3/4 md:left-1/2 lg:left-1/4 xl:left-0 xl:translate-x-0" width="404" height="784" fill="none" viewBox="0 0 404 784">
            <defs>
              <pattern id="pattern-squares" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-primary-200 dark:text-primary-800" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="784" fill="url(#pattern-squares)" />
          </svg>
          <svg className="absolute right-full bottom-0 transform translate-x-1/4 translate-y-1/4 sm:right-3/4 md:right-1/2 lg:right-1/4 xl:right-0 xl:translate-x-0" width="404" height="784" fill="none" viewBox="0 0 404 784">
            <defs>
              <pattern id="pattern-squares-2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-accent-200 dark:text-accent/30" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="404" height="784" fill="url(#pattern-squares-2)" />
          </svg>
        </div>
        
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 lg:py-40">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-6">
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                <span className="block">阅词名著</span>
                <span className="block mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">中英对照阅读</span>
              </h1>
              <p className="mt-6 text-xl text-secondary-700 dark:text-secondary-300 max-w-3xl">
                探索经典文学作品，提升您的英语阅读能力，感受文学的魅力。通过中英对照阅读，轻松理解原著内容。
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/library" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-primary hover:bg-primary-dark transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  浏览书库
                </Link>
                <Link href="/about" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors duration-300">
                  了解更多
                </Link>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative mx-auto w-full rounded-lg shadow-xl overflow-hidden lg:max-w-md">
                <div className="relative block w-full h-80 bg-card-light dark:bg-card-dark rounded-lg overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-300">
                  <HeroImage
                    src="/images/hero-books.jpg"
                    alt="书籍展示"
                    className="w-full h-full object-cover"
                    width={500}
                    height={300}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="text-sm font-medium">探索世界文学经典</p>
                    <p className="text-xs opacity-80">中英对照，轻松阅读</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-card-light dark:bg-card-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">特色功能</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
              更好的阅读体验
            </p>
            <p className="mt-4 max-w-2xl text-xl text-secondary-700 dark:text-secondary-300 lg:mx-auto">
              阅词名著提供多种功能，帮助您更好地阅读和理解英语原著。
            </p>
          </div>

          <div className="mt-16">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {[
                {
                  title: "中英对照阅读",
                  description: "同时展示英文原文和中文翻译，帮助您更好地理解文本内容，提高阅读效率。",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                    </svg>
                  )
                },
                {
                  title: "个性化设置",
                  description: "可调整字体大小，选择仅显示英文或中文，满足不同阅读需求。",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )
                },
                {
                  title: "经典收藏",
                  description: "精选世界文学经典，包括各个时期、各个流派的代表作品。",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  )
                }
              ].map((feature, index) => (
                <div key={index} className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
                      {feature.icon}
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-foreground">{feature.title}</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-secondary-700 dark:text-secondary-300">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Featured Books Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">精选书籍</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
            开始您的阅读之旅
          </p>
          <p className="mt-4 max-w-2xl text-xl text-secondary-700 dark:text-secondary-300 lg:mx-auto">
            我们精心挑选了一系列经典名著，帮助您提升英语阅读能力。
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/library" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-primary hover:bg-primary-dark transition-colors duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            查看更多书籍
          </Link>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="bg-secondary-50 dark:bg-secondary-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">用户评价</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
              他们如何评价阅词名著
            </p>
          </div>

          <div className="mt-16">
            <div className="max-w-3xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-md p-8 relative">
                <div className="absolute -top-4 -left-4 text-primary-200 dark:text-primary-800 opacity-50">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 20H7.5C6.83696 20 6.20107 19.7366 5.73223 19.2678C5.26339 18.7989 5 18.163 5 17.5V12.5C5 11.837 5.26339 11.2011 5.73223 10.7322C6.20107 10.2634 6.83696 10 7.5 10H12.5C13.163 10 13.7989 10.2634 14.2678 10.7322C14.7366 11.2011 15 11.837 15 12.5V27.5C15 28.163 14.7366 28.7989 14.2678 29.2678C13.7989 29.7366 13.163 30 12.5 30H7.5M32.5 20H27.5C26.837 20 26.2011 19.7366 25.7322 19.2678C25.2634 18.7989 25 18.163 25 17.5V12.5C25 11.837 25.2634 11.2011 25.7322 10.7322C26.2011 10.2634 26.837 10 27.5 10H32.5C33.163 10 33.7989 10.2634 34.2678 10.7322C34.7366 11.2011 35 11.837 35 12.5V27.5C35 28.163 34.7366 28.7989 34.2678 29.2678C33.7989 29.7366 33.163 30 32.5 30H27.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xl">
                      L
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-foreground">李明</h3>
                    <p className="text-secondary-600 dark:text-secondary-400">英语爱好者</p>
                  </div>
                </div>
                <p className="text-secondary-700 dark:text-secondary-300 italic">
                  &ldquo;阅词名著帮助我更好地理解英语原著，中英对照的阅读方式让我能够更快地掌握英语表达方式，提高了我的阅读能力。现在我可以更自信地阅读英语原著了！&rdquo;
                </p>
              </div>
              
              <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-md p-8 relative">
                <div className="absolute -top-4 -left-4 text-primary-200 dark:text-primary-800 opacity-50">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 20H7.5C6.83696 20 6.20107 19.7366 5.73223 19.2678C5.26339 18.7989 5 18.163 5 17.5V12.5C5 11.837 5.26339 11.2011 5.73223 10.7322C6.20107 10.2634 6.83696 10 7.5 10H12.5C13.163 10 13.7989 10.2634 14.2678 10.7322C14.7366 11.2011 15 11.837 15 12.5V27.5C15 28.163 14.7366 28.7989 14.2678 29.2678C13.7989 29.7366 13.163 30 12.5 30H7.5M32.5 20H27.5C26.837 20 26.2011 19.7366 25.7322 19.2678C25.2634 18.7989 25 18.163 25 17.5V12.5C25 11.837 25.2634 11.2011 25.7322 10.7322C26.2011 10.2634 26.837 10 27.5 10H32.5C33.163 10 33.7989 10.2634 34.2678 10.7322C34.7366 11.2011 35 11.837 35 12.5V27.5C35 28.163 34.7366 28.7989 34.2678 29.2678C33.7989 29.7366 33.163 30 32.5 30H27.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-xl">
                      W
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-foreground">王小红</h3>
                    <p className="text-secondary-600 dark:text-secondary-400">大学生</p>
                  </div>
                </div>
                <p className="text-secondary-700 dark:text-secondary-300 italic">
                  &ldquo;作为一名英语专业的学生，阅词名著为我提供了丰富的阅读资源。界面简洁美观，功能实用，是我学习英语文学的得力助手。&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
