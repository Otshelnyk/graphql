import { attachProjectXp, projectStatus, projectTotals, uniqueProjectCount } from '../domain/profileMetrics.js';
import { formatXP } from '../domain/number.js';
import { escapeHtml, formatDate } from './html.js';

const display = (value) => escapeHtml(value ?? '—');

export function populateSidebar(data) {
  const attrs = data.userInfo?.attrs ?? {};
  const login = String(data.userInfo?.login ?? '?');
  const firstName = String(attrs.firstName ?? '');
  const lastName = String(attrs.lastName ?? '');
  const name = [firstName, lastName].filter(Boolean).join(' ') || login;
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  setText('avatarInitials', initials || '?');
  setText('sidebarFullname', name);
  setText('sidebarLogin', `@${login}`);
  setText('sidebarLevel', data.level ?? '—');
  setText('sidebarRatio', data.auditStats?.ratio ?? '—');
}

export function overviewView(data) {
  return `
    <section class="stats-grid">
      ${statCard('Total XP', formatXP(data.totalXP))}
      ${statCard('Projects done', uniqueProjectCount(data.projects))}
      ${statCard('Audit ratio', data.auditStats?.ratio ?? '—')}
    </section>
    <section class="charts-section">
      ${chartCard('XP over time', 'Cumulative XP growth', 'chartXPBody')}
      ${chartCard('Audit ratio', 'Done vs received', 'chartAuditBody', ' chart-body--static')}
    </section>`;
}

export function personalInfoView(data) {
  const user = data.userInfo ?? {};
  const attrs = user.attrs ?? {};
  const batch = user.labels?.find((label) => label.labelName?.toLowerCase().includes('batch'))?.labelName;
  return `<div class="info-grid">
    ${infoCard('General', [
      ['First name', attrs.firstName], ['Last name', attrs.lastName], ['Login', user.login, true],
      ['Joined', formatDate(user.createdAt)], ['Batch', batch], ['Gender', attrs.gender],
    ])}
    ${infoCard('Contact', [
      ['Email', maskEmail(attrs.email), true], ['Phone', maskPhone(attrs.phone), true],
      ['City', attrs.addressCity], ['Country', attrs.addressCountry], ['Street', attrs.addressStreet],
    ])}
    ${infoCard('Identity', [
      ['Date of birth', formatDate(attrs.dateOfBirth)], ['Place of birth', attrs.placeOfBirth], ['Country', attrs.countryOfBirth],
      ['ID card', maskId(attrs.idCardNumber)], ['ID issued', formatDate(attrs.dateIssue)], ['ID expires', formatDate(attrs.dateExpiring)], ['Issuing auth', attrs.issuingAuthority],
    ])}
  </div>`;
}

export function projectsView(data) {
  const projects = attachProjectXp(data.projects, data.xpPerProject);
  const totals = projectTotals(projects);
  const rows = projects.length ? projects.map((project) => {
    const name = project.object?.name || project.path?.split('/').pop() || '—';
    const status = projectStatus(project);
    return `<tr>
      <td><span class="project-name" title="${display(name)}">${display(name)}</span></td>
      <td><span class="xp-value">${project.amount == null ? '—' : display(formatXP(project.amount))}</span></td>
      <td><span class="status-badge ${status === 'PASS' ? 'pass' : 'fail'}">${status}</span></td>
      <td><span class="date-value">${display(formatDate(project.createdAt))}</span></td>
    </tr>`;
  }).join('') : '<tr><td colspan="4" class="table-empty">No projects found</td></tr>';
  return `<div class="project-stats">${statCard('Total', totals.total)}${statCard('Passed', totals.passed)}${statCard('Failed', totals.failed)}</div>
    <section class="projects-section"><div class="section-header"><h2 class="section-title">All projects</h2><span class="section-badge">${totals.total}</span></div>
    <div class="table-wrap"><table class="projects-table"><thead><tr><th>Project</th><th>XP</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

export function piscinesView(data) {
  const list = [['piscinego', 'piscine-go'], ['piscine-js', 'piscine-js'], ['piscine-rust', 'piscine-rust'], ['piscine-ai', 'piscine-ai']];
  return `<div class="piscines-grid">${list.map(([key, label]) => piscineCard(label, data.piscines?.[key])).join('')}</div>`;
}

function chartCard(title, subtitle, id, className = '') {
  return `<div class="chart-card"><div class="chart-card-header"><h2 class="chart-title">${title}</h2><p class="chart-sub">${subtitle}</p></div><div class="chart-body${className}" id="${id}"></div></div>`;
}
function statCard(label, value) { return `<div class="stat-card"><p class="stat-label">${escapeHtml(label)}</p><p class="stat-value">${display(value)}</p></div>`; }
function infoCard(title, rows) { return `<section class="info-card"><p class="info-card-title">${title}</p>${rows.map(([key, value, mono]) => `<div class="info-row"><span class="info-key">${key}</span><span class="info-value${mono ? ' mono' : ''}">${display(value)}</span></div>`).join('')}</section>`; }
function piscineCard(label, attempts) {
  if (!attempts?.length) return `<section class="piscine-card not-attempted"><div class="piscine-card-header"><div><p class="piscine-card-name">${label}</p><p class="piscine-card-date">Not attempted</p></div><span class="badge badge-na">n/a</span></div><div class="piscine-grade-row"><span class="piscine-grade-label">Grade</span><span class="piscine-grade-value">—</span></div></section>`;
  const anyPass = attempts.some((attempt) => attempt.passed);
  const anyGrade = attempts.some((attempt) => attempt.grade != null);
  const state = anyPass ? 'pass' : anyGrade ? 'fail' : 'na';
  const text = state === 'na' ? 'n/a' : state.toUpperCase();
  return `<section class="piscine-card"><div class="piscine-card-header"><div><p class="piscine-card-name">${label}</p><p class="piscine-card-date">${attempts.length} attempt${attempts.length === 1 ? '' : 's'}</p></div><span class="badge badge-${state}">${text}</span></div><div class="piscine-attempts">${attempts.map((attempt, index) => { const status = attempt.grade == null ? 'na' : attempt.passed ? 'pass' : 'fail'; return `<div class="piscine-attempt"><span class="piscine-attempt-num">Attempt ${index + 1}</span><span class="piscine-attempt-date">${formatDate(attempt.date)}</span><span class="piscine-attempt-grade">${attempt.grade == null ? '—' : display(Number(attempt.grade).toFixed(2))}</span><span class="badge badge-${status}">${status === 'na' ? 'n/a' : status.toUpperCase()}</span></div>`; }).join('')}</div></section>`;
}
function maskEmail(email) { const [local, domain] = String(email ?? '').split('@'); return domain ? `${local.slice(0, 2)}${'•'.repeat(Math.max(3, local.length - 2))}@${domain}` : '—'; }
function maskPhone(phone) { const value = String(phone ?? ''); return value ? `${value.slice(0, 2)}••••••${value.slice(-3)}` : '—'; }
function maskId(id) { const value = String(id ?? ''); return value ? `••••••${value.slice(-2)}` : '—'; }
function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
