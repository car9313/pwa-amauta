import { describe, it, expect } from 'vitest'
import { authKeys, exerciseKeys, studentKeys, lessonKeys, progressKeys } from './keys'

describe('authKeys', () => {
  it('all returns ["auth"]', () => {
    expect(authKeys.all).toEqual(['auth'])
  })

  it('login returns ["auth", "login"]', () => {
    expect(authKeys.login()).toEqual(['auth', 'login'])
  })

  it('register returns ["auth", "register"]', () => {
    expect(authKeys.register()).toEqual(['auth', 'register'])
  })

  it('session returns ["auth", "session"]', () => {
    expect(authKeys.session()).toEqual(['auth', 'session'])
  })

  it('refresh returns ["auth", "refresh"]', () => {
    expect(authKeys.refresh()).toEqual(['auth', 'refresh'])
  })

  it('parentDashboard includes parentId and tenantId', () => {
    expect(authKeys.parentDashboard('par_001', 'tenant_1')).toEqual([
      'auth', 'parent', 'par_001', 'tenant_1',
    ])
  })

  it('parentDashboard handles null tenantId', () => {
    expect(authKeys.parentDashboard('par_001', null)).toEqual([
      'auth', 'parent', 'par_001', null,
    ])
  })

  it('studentProgress includes studentId and tenantId', () => {
    expect(authKeys.studentProgress('stu_001', 'tenant_1')).toEqual([
      'auth', 'progress', 'stu_001', 'tenant_1',
    ])
  })
})

describe('exerciseKeys', () => {
  it('all returns ["exercises"]', () => {
    expect(exerciseKeys.all).toEqual(['exercises'])
  })

  it('detail includes the exercise id', () => {
    expect(exerciseKeys.detail('ex_001')).toEqual(['exercises', 'detail', 'ex_001'])
  })

  it('byType includes the exercise type', () => {
    expect(exerciseKeys.byType('VISUAL_ADDITION')).toEqual([
      'exercises', 'byType', 'VISUAL_ADDITION',
    ])
  })

  it('byDifficulty includes difficulty level', () => {
    expect(exerciseKeys.byDifficulty(2)).toEqual(['exercises', 'byDifficulty', 2])
  })

  it('count returns ["exercises", "count"]', () => {
    expect(exerciseKeys.count()).toEqual(['exercises', 'count'])
  })

  it('next includes studentId and tenantId', () => {
    expect(exerciseKeys.next('stu_001', 'tenant_1')).toEqual([
      'exercises', 'next', 'stu_001', 'tenant_1',
    ])
  })

  it('next handles null tenantId', () => {
    expect(exerciseKeys.next('stu_001', null)).toEqual([
      'exercises', 'next', 'stu_001', null,
    ])
  })
})

describe('studentKeys', () => {
  it('all returns ["student"]', () => {
    expect(studentKeys.all).toEqual(['student'])
  })

  it('dashboard includes studentId', () => {
    expect(studentKeys.dashboard('stu_001')).toEqual(['student', 'dashboard', 'stu_001'])
  })

  it('allData returns ["student", "all"]', () => {
    expect(studentKeys.allData()).toEqual(['student', 'all'])
  })
})

describe('lessonKeys', () => {
  it('all returns ["lessons"]', () => {
    expect(lessonKeys.all).toEqual(['lessons'])
  })

  it('detail includes lesson id', () => {
    expect(lessonKeys.detail('les_001')).toEqual(['lessons', 'detail', 'les_001'])
  })

  it('bySubject includes subject name', () => {
    expect(lessonKeys.bySubject('math')).toEqual(['lessons', 'bySubject', 'math'])
  })

  it('allData returns ["lessons"] (same as all)', () => {
    expect(lessonKeys.allData()).toEqual(['lessons'])
  })
})

describe('progressKeys', () => {
  it('all returns ["progress"]', () => {
    expect(progressKeys.all).toEqual(['progress'])
  })

  it('student includes studentId', () => {
    expect(progressKeys.student('stu_001')).toEqual(['progress', 'student', 'stu_001'])
  })

  it('byLesson includes studentId and lessonId', () => {
    expect(progressKeys.byLesson('stu_001', 'les_001')).toEqual([
      'progress', 'byLesson', 'stu_001', 'les_001',
    ])
  })

  it('count returns ["progress", "count"]', () => {
    expect(progressKeys.count()).toEqual(['progress', 'count'])
  })
})

describe('cache key freshness', () => {
  it('subsequent calls return fresh arrays (not the same reference)', () => {
    const first = authKeys.session()
    const second = authKeys.session()
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })
})
