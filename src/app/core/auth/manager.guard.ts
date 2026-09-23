import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { ProfileService } from '../services/profile.service';

export const managerGuard: CanActivateFn = () => {
  const profile = inject(ProfileService);
  const router = inject(Router);

  return profile
    .ensureLoaded()
    .pipe(map((me) => (me?.managedTeam ? true : router.createUrlTree(['/calendar']))));
};
