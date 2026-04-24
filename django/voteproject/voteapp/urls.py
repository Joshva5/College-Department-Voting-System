from django import views
from django.urls import path
from .views import admin_students, candidate_dashboard, chart_data, public_announcement, public_stats, register, login, profile, candidates, reset_election, update_candidate, vote, admin_stats, chart_data, toggle_election, add_candidate_p, delete_candidate, admin_candidates_g, admin_candidate_detail, admin_students, toggle_election
from .views import admin_results, admin_candidate_detail, student_dashboard, set_election_time
urlpatterns = [
    path('register/', register),
    path('login/', login),
    path('profile/', profile),
    path('candidates/', candidates),
    path('vote/', vote),
    path('admin/stats/', admin_stats),
    path('admin/chart/', chart_data),
    path('admin/add_candidate/', add_candidate_p),
    path('admin/delete-candidate/<int:id>/', delete_candidate),
    path("admin/candidates/", admin_candidates_g),
    path("admin/delete-candidate/<int:id>/", delete_candidate),
    path("admin/update-candidate/<int:id>/", update_candidate),
    path("admin/students/", admin_students),
    path('admin/candidates/<int:pk>/', admin_candidate_detail),
    path('admin/results/', admin_results),
    path('admin/candidates/<int:pk>/', admin_candidate_detail),
    path('student/dashboard/', student_dashboard),
    path('admin/set-time/', set_election_time),
    path('admin/toggle/', toggle_election),
    path('public/stats/', public_stats),
    path("candidate/dashboard/", candidate_dashboard),
    path("election/toggle/", toggle_election),
    path('public/announcement/', public_announcement),
    path('admin/reset-election/', reset_election),
    # path('admin/election_status/',election_status),
    
   
   


   
]
  





   
