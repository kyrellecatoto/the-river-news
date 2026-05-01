'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { createClient } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '../../../lib/supabase/auth'

const DIVISIONS = ['elementary', 'secondary']
const GROUPS = ['regular', 'demo', 'para']

function keyOf(region_code, division, event_group) {
  return `${region_code}__${division}__${event_group}`
}

function toNonNegativeInt(v) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.trunc(n))
}

function parseNumberInput(raw) {
  if (raw === '') return ''
  const n = Number(raw)
  if (!Number.isFinite(n)) return ''
  return n
}

export default function AdminPalaroTallyPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [regions, setRegions] = useState([])
  const [tallyMap, setTallyMap] = useState({})
  const [savingKey, setSavingKey] = useState(null)

  useEffect(() => {
    checkAuthAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkAuthAndLoad() {
    try {
      const user = await getCurrentUser()

      if (!user) {
        router.push('/admin/login')
        return
      }

      await loadAll()
    } catch (e) {
      console.error(e)
      router.push('/admin/login')
    }
  }

  async function loadAll() {
    try {
      setLoading(true)

      const supabase = createClient()

      const [{ data: rData, error: rErr }, { data: tData, error: tErr }] =
        await Promise.all([
          supabase
            .from('palaro_regions')
            .select('code,name,sort_order')
            .order('sort_order', { ascending: true }),

          supabase
            .from('palaro_medal_tally')
            .select('region_code,division,event_group,gold,silver,bronze'),
        ])

      if (rErr) throw rErr
      if (tErr) throw tErr

      setRegions(rData || [])

      const map = {}

      ;(tData || []).forEach((row) => {
        map[keyOf(row.region_code, row.division, row.event_group)] = {
          gold: row.gold ?? 0,
          silver: row.silver ?? 0,
          bronze: row.bronze ?? 0,
        }
      })

      setTallyMap(map)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load medal tally')
    } finally {
      setLoading(false)
    }
  }

  function getCell(region_code, division, event_group) {
    return (
      tallyMap[keyOf(region_code, division, event_group)] || {
        gold: 0,
        silver: 0,
        bronze: 0,
      }
    )
  }

  function setCell(region_code, division, event_group, patch) {
    const k = keyOf(region_code, division, event_group)

    setTallyMap((prev) => ({
      ...prev,
      [k]: {
        ...(prev[k] || { gold: 0, silver: 0, bronze: 0 }),
        ...patch,
      },
    }))
  }

  async function saveCell(region_code, division, event_group) {
    const k = keyOf(region_code, division, event_group)
    const row = tallyMap[k] || { gold: 0, silver: 0, bronze: 0 }

    try {
      setSavingKey(k)

      const supabase = createClient()

      const payload = {
        region_code,
        division,
        event_group,
        gold: toNonNegativeInt(row.gold),
        silver: toNonNegativeInt(row.silver),
        bronze: toNonNegativeInt(row.bronze),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('palaro_medal_tally').upsert([payload], {
        onConflict: 'region_code,division,event_group',
      })

      if (error) throw error

      toast.success('Saved')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save')
    } finally {
      setSavingKey(null)
    }
  }

  const regionStats = useMemo(() => {
    const totals = regions.map((r) => {
      let gold = 0
      let silver = 0
      let bronze = 0

      for (const division of DIVISIONS) {
        for (const group of GROUPS) {
          const c = getCell(r.code, division, group)

          gold += toNonNegativeInt(c.gold)
          silver += toNonNegativeInt(c.silver)
          bronze += toNonNegativeInt(c.bronze)
        }
      }

      return {
        code: r.code,
        total: { gold, silver, bronze },
      }
    })

    const sorted = [...totals].sort((a, b) => {
      if (b.total.gold !== a.total.gold) return b.total.gold - a.total.gold
      if (b.total.silver !== a.total.silver) return b.total.silver - a.total.silver
      return b.total.bronze - a.total.bronze
    })

    const rankByCode = {}
    sorted.forEach((r, i) => {
      rankByCode[r.code] = i + 1
    })

    const totalsByCode = {}
    totals.forEach((r) => {
      totalsByCode[r.code] = r.total
    })

    return { rankByCode, totalsByCode }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regions, tallyMap])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Palarong Pambansa 2026 — Medal Tally
          </h1>

          <p className="text-gray-400 text-sm mt-1">
            Edit medal counts by Region, Division, and Event Group. Ranking updates
            automatically.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {regions.map((r) => {
          const rank = regionStats.rankByCode[r.code] ?? '-'
          const t = regionStats.totalsByCode[r.code] || {
            gold: 0,
            silver: 0,
            bronze: 0,
          }

          return (
            <div
              key={r.code}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="text-sm text-gray-400">Rank #{rank}</div>

                  <h2 className="text-xl font-bold text-white">{r.name}</h2>

                  <div className="text-xs text-gray-500">{r.code}</div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-2 rounded-lg bg-gray-950 border border-yellow-400/30 text-white">
                    🥇 {t.gold}
                  </span>

                  <span className="px-3 py-2 rounded-lg bg-gray-950 border border-gray-300/30 text-white">
                    🥈 {t.silver}
                  </span>

                  <span className="px-3 py-2 rounded-lg bg-gray-950 border border-orange-300/30 text-white">
                    🥉 {t.bronze}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {DIVISIONS.map((division) => (
                  <div
                    key={division}
                    className="bg-gray-950/60 border border-gray-800 rounded-xl p-4"
                  >
                    <h3 className="text-white font-bold capitalize mb-4">
                      {division}
                    </h3>

                    <div className="space-y-4">
                      {GROUPS.map((group) => {
                        const cell = getCell(r.code, division, group)
                        const k = keyOf(r.code, division, group)
                        const isSaving = savingKey === k

                        return (
                          <div
                            key={k}
                            className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-white font-semibold capitalize">
                                {group}
                              </div>

                              <button
                                onClick={() => saveCell(r.code, division, group)}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold"
                              >
                                {isSaving ? 'Saving…' : 'Save'}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <label className="space-y-1">
                                <span className="text-xs text-yellow-300">
                                  Gold
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  value={cell.gold}
                                  onChange={(e) =>
                                    setCell(r.code, division, group, {
                                      gold: parseNumberInput(e.target.value),
                                    })
                                  }
                                  className="w-full px-4 py-3 rounded-lg bg-gray-950 border border-gray-800 text-white text-base focus:outline-none focus:border-yellow-400"
                                  placeholder="0"
                                />
                              </label>

                              <label className="space-y-1">
                                <span className="text-xs text-gray-300">
                                  Silver
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  value={cell.silver}
                                  onChange={(e) =>
                                    setCell(r.code, division, group, {
                                      silver: parseNumberInput(e.target.value),
                                    })
                                  }
                                  className="w-full px-4 py-3 rounded-lg bg-gray-950 border border-gray-800 text-white text-base focus:outline-none focus:border-gray-300"
                                  placeholder="0"
                                />
                              </label>

                              <label className="space-y-1">
                                <span className="text-xs text-orange-300">
                                  Bronze
                                </span>

                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  value={cell.bronze}
                                  onChange={(e) =>
                                    setCell(r.code, division, group, {
                                      bronze: parseNumberInput(e.target.value),
                                    })
                                  }
                                  className="w-full px-4 py-3 rounded-lg bg-gray-950 border border-gray-800 text-white text-base focus:outline-none focus:border-orange-300"
                                  placeholder="0"
                                />
                              </label>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-400">
          Ranking is computed from totals:
          <span className="text-gray-200 font-semibold"> Gold</span> →
          <span className="text-gray-200 font-semibold"> Silver</span> →
          <span className="text-gray-200 font-semibold"> Bronze</span>.
        </div>
      </div>
    </div>
  )
}