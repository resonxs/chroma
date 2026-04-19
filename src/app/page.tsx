import { useCallback, useEffect, useRef, useState } from 'react'

const gradientStyle = {
	background:
		'linear-gradient(90deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)',
	WebkitBackgroundClip: 'text',
	backgroundClip: 'text',
	color: 'transparent'
} as const

export default function Home() {
	const [screen, setScreen] = useState<'start' | 'game' | 'end'>('start')
	const [target, setTarget] = useState('')
	const [showTarget, setShowTarget] = useState(true)
	const [options, setOptions] = useState<string[]>([])
	const [score, setScore] = useState(0)
	const [timer, setTimer] = useState(350)
	const [msg, setMsg] = useState('')
	const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy')
	const [correctAnim, setCorrectAnim] = useState(false)
	const [wrongAnim, setWrongAnim] = useState(false)
	const [locked, setLocked] = useState(false)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)
	const timeoutRef = useRef<NodeJS.Timeout | null>(null)

	const randomRgb = useCallback(() => {
		const r = Math.floor(Math.random() * 256)
		const g = Math.floor(Math.random() * 256)
		const b = Math.floor(Math.random() * 256)
		return `rgb(${r}, ${g}, ${b})`
	}, [])

	const trap = useCallback(
		(color: string, points: number, diff: 'easy' | 'hard') => {
			const match = color.match(/\d+/g)
			if (!match) return randomRgb()

			let offset: number
			if (diff === 'easy') {
				if (points < 3) offset = 55
				else if (points < 6) offset = 30
				else if (points < 10) offset = 18
				else offset = 12
			} else {
				if (points < 2) offset = 25
				else if (points < 4) offset = 12
				else if (points < 7) offset = 6
				else offset = 3
			}

			let r = +match[0] + (Math.random() - 0.5) * offset * 2
			let g = +match[1] + (Math.random() - 0.5) * offset * 2
			let b = +match[2] + (Math.random() - 0.5) * offset * 2

			r = Math.min(255, Math.max(0, Math.floor(r)))
			g = Math.min(255, Math.max(0, Math.floor(g)))
			b = Math.min(255, Math.max(0, Math.floor(b)))

			return `rgb(${r}, ${g}, ${b})`
		},
		[randomRgb]
	)

	const generateSet = useCallback(
		(correct: string, points: number, diff: 'easy' | 'hard') => {
			const set = [correct]
			while (set.length < 4) {
				const fake = trap(correct, points, diff)
				if (!set.includes(fake)) set.push(fake)
			}
			for (let i = set.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1))
				;[set[i], set[j]] = [set[j], set[i]]
			}
			return set
		},
		[trap]
	)

	const newRound = useCallback(() => {
		const color = randomRgb()
		setTarget(color)
		setShowTarget(true)
		setTimer(350)
		setMsg('Запомни цвет')
		setLocked(false)

		let ms = 3500
		if (intervalRef.current) clearInterval(intervalRef.current)

		intervalRef.current = setInterval(() => {
			ms -= 10
			setTimer(Math.floor(ms / 10))
			if (ms <= 0) {
				if (intervalRef.current) clearInterval(intervalRef.current)
				setShowTarget(false)
				setOptions(generateSet(color, score, difficulty))
				setMsg('Какой цвет был?')
			}
		}, 10)
	}, [randomRgb, generateSet, score, difficulty])

	const start = useCallback(() => {
		setScore(0)
		setScreen('game')
		setLocked(false)
		newRound()
	}, [newRound])

	const answer = useCallback(
		(selected: string) => {
			if (locked) return
			
			if (intervalRef.current) clearInterval(intervalRef.current)
			if (timeoutRef.current) clearTimeout(timeoutRef.current)

			setLocked(true)

			if (selected === target) {
				setScore(prev => prev + 1)
				setMsg('Верно!')
				setCorrectAnim(true)
				timeoutRef.current = setTimeout(() => {
					newRound()
				}, 800)
			} else {
				setMsg('Неверно')
				setWrongAnim(true)
				timeoutRef.current = setTimeout(() => {
					setScreen('end')
				}, 1000)
			}
		},
		[target, newRound, locked]
	)

	const reset = useCallback(() => {
		setScreen('start')
		setOptions([])
		setShowTarget(true)
		setLocked(false)
		if (intervalRef.current) clearInterval(intervalRef.current)
		if (timeoutRef.current) clearTimeout(timeoutRef.current)
	}, [])

	useEffect(() => {
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current)
			if (timeoutRef.current) clearTimeout(timeoutRef.current)
		}
	}, [])

	useEffect(() => {
		if (correctAnim) {
			const t = setTimeout(() => setCorrectAnim(false), 500)
			return () => clearTimeout(t)
		}
	}, [correctAnim])

	useEffect(() => {
		if (wrongAnim) {
			const t = setTimeout(() => setWrongAnim(false), 500)
			return () => clearTimeout(t)
		}
	}, [wrongAnim])

	if (screen === 'start') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white px-4">
				<div className="w-full max-w-sm bg-black rounded-2xl p-8 shadow-xl">
					<div>
						<h1
							className="text-7xl font-bold mb-3"
							style={gradientStyle}
						>
							оттенки
						</h1>
						<p className="text-sm text-white/60 leading-relaxed">
							Человеческий мозг плохо запоминает оттенки цветов. Эта игра
							покажет, насколько хороша (или плоха) твоя цветовая память.
						</p>

						<div className="mt-8 space-y-3">
							<div className="flex gap-3">
								<button
									onClick={() => setDifficulty('easy')}
									className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
										difficulty === 'easy'
											? 'bg-white text-black'
											: 'bg-white/10 text-white/60 hover:bg-white/20'
									}`}
								>
									легкий
								</button>
								<button
									onClick={() => setDifficulty('hard')}
									className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
										difficulty === 'hard'
											? 'bg-white text-black'
											: 'bg-white/10 text-white/60 hover:bg-white/20'
									}`}
								>
									сложный
								</button>
							</div>

							<button
								onClick={start}
								className="w-full bg-white text-black font-medium py-3 rounded-full mt-4 hover:opacity-90 transition"
							>
								начать
							</button>
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (screen === 'end') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white px-4">
				<div className="w-full max-w-sm bg-black rounded-2xl p-8 text-center shadow-xl">
					<div className="text-6xl font-bold text-white">{score}</div>
					<div className="text-sm text-white/50 mt-2">очков</div>
					<div className="mt-10 space-y-3">
						<button
							onClick={start}
							className="w-full bg-white text-black font-medium py-3 rounded-full hover:opacity-90 transition"
						>
							ещё раз
						</button>
						<button
							onClick={reset}
							className="w-full bg-white/10 text-white/60 font-medium py-3 rounded-full hover:bg-white/20 transition"
						>
							меню
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-white px-4">
			<div className="w-full max-w-sm bg-black rounded-2xl p-6 shadow-xl">
				<div className="flex justify-between items-center mb-5">
					<span className="text-sm text-white/40">
						{difficulty === 'easy' ? 'легкий' : 'сложный'}
					</span>
					<span className="text-sm text-white/40">{score}</span>
				</div>

				{showTarget ? (
					<>
						<div
							className="text-right text-6xl font-bold mb-3"
							style={gradientStyle}
						>
							{timer}
						</div>
						<div
							className="w-full aspect-square rounded-xl shadow-lg transition"
							style={{ backgroundColor: target }}
						/>
						<div className="text-center text-white/40 text-sm mt-5">{msg}</div>
					</>
				) : (
					<div>
						<div
							className={`text-center text-sm mb-6 transition ${
								correctAnim
									? 'text-green-400'
									: wrongAnim
										? 'text-red-400'
										: 'text-white/60'
							}`}
						>
							{msg}
						</div>
						<div className="grid grid-cols-2 gap-3">
							{options.map((c, i) => (
								<button
									key={i}
									onClick={() => answer(c)}
									className="aspect-square rounded-xl active:scale-95 transition"
									style={{ backgroundColor: c }}
								/>
							))}
						</div>
					</div>
				)}

				<button
					onClick={reset}
					className="w-full bg-white/10 text-white/40 text-sm py-2.5 rounded-full mt-6 hover:bg-white/20 transition"
				>
					закончить игру
				</button>
			</div>
		</div>
	)
}
