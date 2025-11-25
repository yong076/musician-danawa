export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        <h1 className="text-4xl font-bold text-center">
          🎸 뮤지션 다나와
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400">
          한국의 모든 악기 상점 가격을 한눈에 비교하세요
        </p>

        <div className="w-full max-w-2xl mt-8">
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">검색</h2>
            <input
              type="text"
              placeholder="악기 이름을 검색하세요 (예: Fender Stratocaster)"
              className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🎹 키보드/신디사이저</h3>
            <p className="text-gray-600 dark:text-gray-300">최저가 비교</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🎸 기타/베이스</h3>
            <p className="text-gray-600 dark:text-gray-300">최저가 비교</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🥁 드럼/퍼커션</h3>
            <p className="text-gray-600 dark:text-gray-300">최저가 비교</p>
          </div>
        </div>
      </main>
    </div>
  );
}
