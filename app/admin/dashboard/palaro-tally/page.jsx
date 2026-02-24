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
  // allow blank while typing
  if (raw === '') return ''
  const n = Number(raw)
  if (!Number.isFinite(n)) return ''
  return n
}

export default function AdminPalaroTallyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [regions, setRegions] = useState([])
  const [tallyMap, setTallyMap] = useState({}) // key => {gold,silver,bronze}
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

      const [{ data: rData, error: rErr }, { data: tData, error: tErr }] = await Promise.all([
        supabase.from('palaro_regions').select('code,name,sort_order').order('sort_order', { ascending: true }),
        supabase.from('palaro_medal_tally').select('region_code,division,event_group,gold,silver,bronze'),
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
    return tallyMap[keyOf(region_code, division, event_group)] || { gold: 0, silver: 0, bronze: 0 }
  }

  function setCell(region_code, division, event_group, patch) {
    const k = keyOf(region_code, division, event_group)
    setTallyMap((prev) => ({
      ...prev,
      [k]: { ...(prev[k] || { gold: 0, silver: 0, bronze: 0 }), ...patch },
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

  const columns = useMemo(() => {
    // creates 6 blocks: Elementary(regular/demo/para) + Secondary(regular/demo/para)
    const cols = []
    for (const division of DIVISIONS) {
      for (const group of GROUPS) {
        cols.push({ division, group, label: `${division} • ${group}` })
      }
    }
    return cols
  }, [])

  // Totals per region + ranking (Gold → Silver → Bronze)
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

      return { code: r.code, total: { gold, silver, bronze } }
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

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Palarong Pambansa 2026 — Medal Tally</h1>
          <p className="text-gray-400 text-sm mt-1">
            Edit medal counts by Region × (Elementary/Secondary) × (Regular/Demo/Para). Ranking updates automatically.
          </p>
        </div>

        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full">
            <thead className="bg-gray-950">
              <tr className="text-left text-xs text-gray-300">
                <th className="p-4 w-[90px]">Rank</th>
                <th className="p-4 w-[320px]">Region</th>
                <th className="p-4 w-[220px]">
                  <div className="font-bold">Totals</div>
                  <div className="text-[10px] text-gray-500 mt-1">Gold / Silver / Bronze</div>
                </th>

                {columns.map((c) => (
                  <th key={c.label} className="p-4">
                    <div className="font-bold capitalize">{c.label}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Gold / Silver / Bronze</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {regions.map((r) => {
                const rank = regionStats.rankByCode[r.code] ?? '-'
                const t = regionStats.totalsByCode[r.code] || { gold: 0, silver: 0, bronze: 0 }

                return (
                  <tr key={r.code} className="border-t border-gray-800 hover:bg-gray-800/30">
                    <td className="p-4 text-white font-extrabold">{rank}</td>

                    <td className="p-4">
                      <div className="text-white font-semibold">{r.name}</div>
                      <div className="text-[11px] text-gray-500">{r.code}</div>
                    </td>

                    <td className="p-4">
                      <div className="inline-flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 rounded bg-gray-950 border border-yellow-400/30 text-white">
                          {t.gold}
                        </span>
                        <span className="px-2 py-1 rounded bg-gray-950 border border-gray-300/30 text-white">
                          {t.silver}
                        </span>
                        <span className="px-2 py-1 rounded bg-gray-950 border border-orange-300/30 text-white">
                          {t.bronze}
                        </span>
                      </div>
                    </td>

                    {columns.map((c) => {
                      const cell = getCell(r.code, c.division, c.group)
                      const k = keyOf(r.code, c.division, c.group)
                      const isSaving = savingKey === k

                      return (
                        <td key={k} className="p-4 align-top">
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={cell.gold}
                              onChange={(e) =>
                                setCell(r.code, c.division, c.group, { gold: parseNumberInput(e.target.value) })
                              }
                              className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-800 text-white text-sm focus:outline-none focus:border-yellow-400"
                              placeholder="G"
                            />
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={cell.silver}
                              onChange={(e) =>
                                setCell(r.code, c.division, c.group, { silver: parseNumberInput(e.target.value) })
                              }
                              className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-800 text-white text-sm focus:outline-none focus:border-gray-300"
                              placeholder="S"
                            />
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={cell.bronze}
                              onChange={(e) =>
                                setCell(r.code, c.division, c.group, { bronze: parseNumberInput(e.target.value) })
                              }
                              className="w-full px-3 py-2 rounded-lg bg-gray-950 border border-gray-800 text-white text-sm focus:outline-none focus:border-orange-300"
                              placeholder="B"
                            />
                          </div>

                          <button
                            onClick={() => saveCell(r.code, c.division, c.group)}
                            disabled={isSaving}
                            className="mt-2 w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold"
                          >
                            {isSaving ? 'Saving…' : 'Save'}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
          Ranking is computed from totals: <span className="text-gray-200 font-semibold">Gold</span> →{' '}
          <span className="text-gray-200 font-semibold">Silver</span> →{' '}
          <span className="text-gray-200 font-semibold">Bronze</span>.
        </div>
      </div>
    </div>
  )
}