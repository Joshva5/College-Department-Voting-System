from django.db import models
from django.contrib.auth.models import User

# Create your models here.


class Student(models.Model):

    DEPARTMENT_CHOICES = [
        ('CSE', 'Computer Science'),
       
    ]

    YEAR_CHOICES = [
        ('1', '1st Year'),
        ('2', '2nd Year'),
        ('3', '3rd Year'),
       
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, null = True, blank = True)
    name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=10, choices=DEPARTMENT_CHOICES, null=True, blank=True )
    year = models.CharField(max_length=5, choices=YEAR_CHOICES,null=True, blank=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    votes_cast = models.IntegerField(default=0)

    def __str__(self):
        return self.student_id
    
    ROLE_CHOICES = [
       ('PRESIDENT', 'President'),
        ('VP', 'Vice President'),
        ('SPORTS', 'Sports'),
        ('CULTURAL', 'Cultural Captain')
]
# Roles (President, etc.)
class Role(models.Model):
    name = models.CharField(max_length=50, choices=Student.ROLE_CHOICES, null=True, blank=True)

# Candidates
class Candidate(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE ,null=True, blank=True )  
    name = models.CharField(max_length=100)
    department = models.CharField(max_length=50, null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, choices=Student.ROLE_CHOICES, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    @property
    def vote_count(self):
        return self.received_votes.count()
   

# Vote (One vote per role per student)
class Vote(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='received_votes')

    class Meta:
        unique_together = ('student', 'role')  # 🔥 Important rule  




from datetime import timedelta

# class ElectionStatus(models.Model):
#     is_active = models.BooleanField(default=True)
#     end_time = models.DateTimeField(null=True, blank=True)   # ✅ timer

#     def time_left(self):
#         if self.end_time:
#             diff = self.end_time - timezone.now()
#             return int(diff.total_seconds())
#         return 0
    
from django.utils import timezone

class ElectionStatus(models.Model):
    is_active = models.BooleanField(default=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def time_left(self):
        if self.end_time:
            diff = self.end_time - timezone.now()

            # 🔴 AUTO STOP
            if diff.total_seconds() <= 0:
                if self.is_active:
                    self.is_active = False
                    self.save()

                return 0

            return int(diff.total_seconds())

        return 0
    
    def __str__(self):
        return "Active" if self.is_active else "Inactive"