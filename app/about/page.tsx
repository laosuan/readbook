export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-secondary-900 dark:text-secondary-100 sm:text-4xl text-center mb-8">
          关于阅词名著
        </h1>
        
        <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md p-8 mb-8 border border-secondary-100 dark:border-secondary-800">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">我们的使命</h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4 leading-relaxed">
            阅词名著致力于为中文读者提供高质量的英语经典名著阅读体验。我们相信，通过中英对照阅读，读者可以更好地理解原著的精髓，同时提高英语阅读能力。
          </p>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4 leading-relaxed">
            我们的目标是让更多人能够接触到世界文学经典，感受不同文化的魅力，拓宽视野，丰富精神世界。
          </p>
        </div>
        
        <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md p-8 mb-8 border border-secondary-100 dark:border-secondary-800">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">我们的特色</h2>
          <ul className="space-y-4">
            <li className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-500 dark:bg-primary-600 text-white">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">中英对照阅读</h3>
                <p className="mt-2 text-secondary-600 dark:text-secondary-400">提供原文与中文翻译的对照阅读，帮助您更好地理解文本内容。</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-500 dark:bg-primary-600 text-white">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">经典名著收藏</h3>
                <p className="mt-2 text-secondary-600 dark:text-secondary-400">精选世界文学经典，包括各个时期、各个流派的代表作品。</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary-500 dark:bg-primary-600 text-white">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100">个性化阅读体验</h3>
                <p className="mt-2 text-secondary-600 dark:text-secondary-400">可调整字体大小，选择仅显示英文或中文，满足不同阅读需求。</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-md p-8 border border-secondary-100 dark:border-secondary-800">
          <h2 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">联系我们</h2>
          <p className="text-secondary-600 dark:text-secondary-400 mb-4 leading-relaxed">
            如果您有任何问题、建议或合作意向，欢迎通过以下方式联系我们：
          </p>
          <ul className="text-secondary-600 dark:text-secondary-400 space-y-2">
            <li>邮箱：contact@readbook.com</li>
            <li>微信公众号：阅词名著</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 