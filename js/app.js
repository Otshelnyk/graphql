import { signIn } from './auth/authService.js';
import { clearToken, getToken, saveToken } from './auth/tokenStore.js';
import { createLoginController } from './controllers/loginController.js';
import { createProfileController } from './controllers/profileController.js';
import { createGraphQLClient } from './infrastructure/graphqlClient.js';
import { createProfileRepository } from './repositories/profileRepository.js';
import { loadProfile } from './application/loadProfile.js';
import { overviewView, personalInfoView, piscinesView, populateSidebar, projectsView } from './presentation/profileViews.js';
import { renderOverviewCharts } from './presentation/charts.js';

const root = document.getElementById('app');
const query = createGraphQLClient({ getToken, onUnauthorized: clearToken });
const repository = createProfileRepository(query);

const profile = createProfileController({
  root,
  loadProfile: () => loadProfile(repository),
  populateSidebar,
  renderers: { overview: overviewView, personal: personalInfoView, projects: projectsView, piscines: piscinesView },
  renderCharts: renderOverviewCharts,
  onLogout: () => { clearToken(); login.show(); },
  onSessionExpired: () => login.show(),
});

const login = createLoginController({ root, signIn, saveToken, onAuthenticated: profile.show });

getToken() ? profile.show() : login.show();
