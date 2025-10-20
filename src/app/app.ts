import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(public authService: AuthService) {}

  ngOnInit() {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    if (this.authService.isAuthenticated()) {
      // L'utilisateur est connecté, rien à faire
    }
  }

  logout() {
    this.authService.logout();
    // Rediriger vers la page d'accueil après déconnexion
    window.location.href = '/';
  }
}
