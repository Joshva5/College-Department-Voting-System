from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Student
from .serializers import StudentSerializer
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Student, Vote, Candidate, Role, ElectionStatus

Role.objects.get_or_create(name="PRESIDENT")
Role.objects.get_or_create(name="VP")
Role.objects.get_or_create(name="SPORTS")
Role.objects.get_or_create(name="CULTURAL")

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Student
import re

@api_view(['POST'])
def register(request):
    data = request.data.copy()

    # ✅ Required fields validation
    required_fields = ['name', 'student_id', 'department', 'email', 'password']
    for field in required_fields:
        if not data.get(field):
            return Response({field: f"{field} is required"}, status=400)

    # ✅ Student ID REGEX VALIDATION
    pattern = r'^26ECS[0-9]{4}$'
    if not re.match(pattern, data['student_id']):
        return Response(
            {"error": "Student ID must be like 26ECS0001"},
            status=400
        )

    # ✅ Password validation (REAL WORLD 🔥)
    password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$'
    if not re.match(password_pattern, data['password']):
        return Response({
            "error": "Password must contain uppercase, lowercase, number & special character"
        }, status=400)

    # ✅ Duplicate check
    if Student.objects.filter(student_id=data['student_id']).exists():
        return Response({"error": "Student ID already exists"}, status=400)

    if Student.objects.filter(email=data['email']).exists():
        return Response({"error": "Email already exists"}, status=400)

    # ✅ Create Django user
    user = User.objects.create_user(
        username=data['student_id'],
        email=data['email'],
        password=data['password']
    )

    # ✅ Create Student profile
    student = Student.objects.create(
        user=user,
        name=data['name'],
        student_id=data['student_id'],
        department=data['department'],
        email=data['email']
    )

    return Response({"message": "Registered successfully"}, status=201)


@api_view(['POST'])
def login(request):

    student_id = request.data.get("student_id")
    password = request.data.get("password")

    user = authenticate(username=student_id, password=password)

    if user is None:
        return Response({"error": "Invalid credentials"})

    refresh = RefreshToken.for_user(user)

    # ✅ ADMIN
    if user.is_superuser:
        return Response({
            "token": str(refresh.access_token),
            "role": "ADMIN",
            "name": "admin"
        })

    # ✅ STUDENT
    student = Student.objects.get(user=user)

    # 🔥 CHECK: IS THIS STUDENT A CANDIDATE?
    is_candidate = Candidate.objects.filter(student=student).exists()

    if is_candidate:
        return Response({
            "token": str(refresh.access_token),
            "role": "CANDIDATE",   # 🔥 IMPORTANT
            "name":student.name,
            "student_id": student.student_id,
            "department": student.department
        })

    else:
        return Response({
            "token": str(refresh.access_token),
            "role": "STUDENT",   # 🔥 IMPORTANT
            "name": student.name,
            "student_id": student.student_id,
            "department": student.department
        })

# 👨‍🎓 PROFILE
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    student = Student.objects.get(user=request.user)

    return Response({
        "name": student.name,
        "student_id": student.student_id,
        "department": student.department,
        "votes_cast": student.votes_cast

    })


# 🗳️ GET ALL CANDIDATES
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def candidates(request):
    result = []

    for role in Role.objects.all():
        result.append({
            "role_id": role.id,
            "role": role.name,
            "candidates": [
                {
                    "id": c.id,
                    "name": c.name,
                    "department": c.department,
                    "votes": Vote.objects.filter(candidate=c).count()
                }
                for c in Candidate.objects.filter(role=role)
            ]
        })

    return Response(result)


from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Candidate, Student
from .serializers import CandidateSerializer

@api_view(['GET'])
def candidate_dashboard(request):

    # 👤 current logged user (simple version)
    student_id = request.query_params.get("student_id")

    profile = None
    if student_id:
        try:
            student = Student.objects.get(student_id=student_id)

            profile = {
                "student_id": student.student_id,
                "name": student.name,
                "department": student.department,
                "role": "Candidate"  # or map role if needed
            }
        except:
            profile = {}

    # 📊 stats
    total_students = Student.objects.count()
    election = ElectionStatus.objects.first()

    stats = {
        "students": total_students,
        "active": election.is_active if election else False
    }

    # 📋 candidates
    candidates = Candidate.objects.all()
    serialized = CandidateSerializer(candidates, many=True)

    return Response({
        "profile": profile,
        "stats": stats,
        "candidates": serialized.data
    })


# ✅ VOTE API

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote(request):

    user = request.user

    # 🔥 convert user → student
    try:
        student = Student.objects.get(user=user)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)

    role_id = request.data.get("role_id")
    candidate_id = request.data.get("candidate_id")

    # ✅ prevent duplicate vote
    if Vote.objects.filter(student=student, role_id=role_id).exists():
        return Response({"error": "Already voted"})

    # ✅ create vote
    Vote.objects.create(
        student=student,   # 🔥 FIX
        role_id=role_id,
        candidate_id=candidate_id
    )
    
    student.votes_cast += 1
    student.save()
    
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        "votes",   # same as consumer group
        {
            "type": "send_vote_update",
            "message": "New vote added"
        }
    )

    return Response({"message": "Vote submitted"})

# 📊 ADMIN STATS
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    total_students = Student.objects.count()
    total_votes = Vote.objects.count()

    roles = Role.objects.annotate(count=Count('candidate')).values('name', 'count')

    return Response({
        "students": total_students,
        "votes": total_votes,
        "roles": list(roles)
    })
    
@api_view(['GET'])
@permission_classes([AllowAny])   # 🔥 IMPORTANT
def public_stats(request):
    return Response({
        "students": Student.objects.count(),
        "votes": Vote.objects.count(),
        "roles": Role.objects.count()
    })


# 📊 CHART DATA
@api_view(['GET'])
@permission_classes([IsAuthenticated])

def chart_data(request):

    # PIE
    candidates = Candidate.objects.all()
    pie = [
        {
            "name": c.name,
            "votes": Vote.objects.filter(candidate=c).count(),
            "role": c.role.name if c.role else ""
        }
        for c in candidates
    ]

    # BAR
    roles = Role.objects.all()
    bar = [
        {
            "role": r.name,
            "votes": Vote.objects.filter(candidate__role=r).count()
        }
        for r in roles
    ]

    return Response({
        "pie": pie,
        "bar": bar
    })

# ▶️ START / STOP ELECTION
# @api_view(['POST'])
# def toggle_election(request):
#     status, _ = ElectionStatus.objects.get_or_create(id=1)
#     status.is_active = not status.is_active
#     status.save()

#     return Response({"active": status.is_active})


# views.py


from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def toggle_election(request):
    action = request.data.get("action")  # start / stop

    election, created = ElectionStatus.objects.get_or_create(id=1)

    if action == "start":
        election.is_active = True
        Candidate.objects.update(is_active=True)   # ✅ all active

    elif action == "stop":
        election.is_active = False
        Candidate.objects.update(is_active=False)  # ❌ all inactive

    election.save()

    return Response({
        "message": f"Election {action}ed",
        "status": election.is_active
    })


# ➕ ADD CANDIDATE
@api_view(['POST'])
def add_candidate_p(request):

    student_id = request.data.get("student_id")
    role_name = request.data.get("role")

    if not student_id or not role_name:
        return Response({"error": "Missing data"}, status=400)

    try:
        student = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        return Response({"error": "Student not found"}, status=404)

    if Candidate.objects.filter(student=student).exists():
        return Response({"error": "Already a candidate"}, status=400)

    try:
        role_obj = Role.objects.get(name__iexact=role_name)
    except Role.DoesNotExist:
        return Response({"error": "Invalid role"}, status=400)

    Candidate.objects.create(
        student=student,
        name=student.name,
        department=student.department,
        role=role_obj
    )

    return Response({"message": "Candidate added successfully"})

# ❌ DELETE
@api_view(['DELETE'])
def delete_candidate(request, id):
    Candidate.objects.get(id=id).delete()
    return Response({"msg": "Deleted"})

@api_view(['GET'])
def admin_candidates_g(request):
    data = []
    for c in Candidate.objects.all():
        data.append({
            "id": c.id,
            "student_id": c.student.student_id if c.student else "-",   # ✅ FIX
            "name": c.name,
            "department": c.department,
            "role": c.role.name if c.role else "",
            "votes": c.vote_count,
            "is_active": c.is_active
            })
    return Response(data)

  

@api_view(['PUT'])
def update_candidate(request, id):
    c = Candidate.objects.get(id=id)
    c.name = request.data["name"]
    c.department = request.data["department"]
    c.is_active = request.data["status"]
    c.save()

    return Response({"msg": "Updated"})


@api_view(['GET'])
def admin_students(request):
    data = []

    for s in Student.objects.all():
        total_roles = Role.objects.count()
        voted = Vote.objects.filter(student=s).count()

        if voted == 0:
            status = "Not Voted"
        elif voted < total_roles:
            status = "Partial"
        else:
            status = "Completed"

        data.append({
            "student_id": s.student_id,
            "name": s.name,
            "department": s.department,
            "votes_cast": voted,
            "total_roles": total_roles,
            "status": status
        })

    return Response(data)

 
@api_view(['DELETE', 'PUT'])
def admin_candidate_detail(request, pk):

    try:
        c = Candidate.objects.get(id=pk)
    except Candidate.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    # ❌ DELETE
    if request.method == 'DELETE':
        c.delete()
        return Response({"msg": "Deleted successfully"})

    # ✏️ UPDATE
    if request.method == 'PUT':
        data = request.data

        # ✅ BASIC UPDATE
        c.name = data.get("name", c.name)
        c.department = data.get("department", c.department)
        c.is_active = data.get("is_active", c.is_active)

        # ✅ 🔥 ROLE FIX (IMPORTANT)
        role_name = data.get("role")

        if role_name:
            try:
                role_obj = Role.objects.get(name=role_name)
                c.role = role_obj   # ✅ correct
            except Role.DoesNotExist:
                return Response({"error": "Invalid role"}, status=400)

        c.save()

        return Response({"msg": "Updated successfully"})
    
    
@api_view(['GET'])
def admin_results(request):

    result = []

    for role in Role.objects.all():

        candidates = Candidate.objects.filter(role=role)

        candidate_data = []
        max_votes = 0
        winner = None

        for c in candidates:
            vote_count = Vote.objects.filter(candidate=c).count()

            candidate_data.append({
                "id": c.id,
                "name": c.name,
                "department": c.department,
                "votes": vote_count
            })

            # 🏆 find winner
            if vote_count > max_votes:
                max_votes = vote_count
                winner = c.name

        result.append({
            "role": role.name,
            "candidates": candidate_data,
            "winner": winner,
            "max_votes": max_votes
        })

    return Response(result)


from django.utils import timezone
from datetime import timedelta

# def get_time_left(end_time):
#     if end_time:
#         remaining = (end_time - timezone.now()).total_seconds()
#         return max(0, int(remaining))
#     return 0

@api_view(['POST'])
def set_election_time(request):
    minutes = int(request.data.get("minutes", 0))

    obj, _ = ElectionStatus.objects.get_or_create(id=1)

    obj.end_time = timezone.now() + timedelta(minutes=minutes)
    obj.is_active = True
    
    obj.save()

    return Response({"msg": "Time set"})

from django.utils import timezone
from datetime import timedelta

def get_time_left(end_time):
    if end_time:
        remaining = (end_time - timezone.now()).total_seconds()
        return max(0, int(remaining))
    return 0


@api_view(['GET'])
def student_dashboard(request):
    student = request.user.student

    # ✅ GET election status
    status = ElectionStatus.objects.first()

    # ✅ default values
    is_active = False
    time_left = 0

    if status:
        is_active = status.is_active
        time_left = get_time_left(status.end_time)

        # ✅ AUTO STOP when time ends
        if time_left == 0 and status.is_active:
            status.is_active = False
            status.save()
            is_active = False

    # ✅ votes
    voted = Vote.objects.filter(student=student)

    voted_roles = []
    voted_candidates = {}

    for v in voted:
        voted_roles.append(v.role.id)
        voted_candidates[v.role.id] = v.candidate.id

    return Response({
        "votes_cast": voted.count(),
        "total_roles": Role.objects.count(),
        "is_active": is_active,
        "time_left": time_left,
        "total_votes": Vote.objects.count(),
        "voted_roles": voted_roles,
        "voted_candidates": voted_candidates
    })

# @api_view(['GET'])
# def student_dashboard(request):
#     student = request.user.student

#     voted = Vote.objects.filter(student=student)

#     voted_roles = []
#     voted_candidates = {}

#     for v in voted:
#         voted_roles.append(v.role.id)
#         voted_candidates[v.role.id] = v.candidate.id   # ✅ KEY FIX

#     return Response({
#         "votes_cast": voted.count(),
#         "total_roles": Role.objects.count(),
#         "is_active": status.is_active,
#         "time_left": time_left,
#         "total_votes": Vote.objects.count(),
#         "voted_roles": voted_roles,
#         "voted_candidates": voted_candidates   # ✅ SEND THIS
#     })


from django.utils import timezone

@api_view(['GET'])
def public_announcement(request):
    status = ElectionStatus.objects.first()

    if not status:
        return Response({"seconds": 0, "message": "No election"})

    if not status.is_active:
        return Response({"seconds": 0, "message": "Election stopped"})

    remaining = status.end_time - timezone.now()
    seconds = int(remaining.total_seconds())

    return Response({
        "seconds": seconds   # 🔥 send seconds
    })  
    
@api_view(['POST'])
def reset_election(request):

    # ❌ delete votes only
    Vote.objects.all().delete()

    # 🔄 reset candidate votes
    for c in Candidate.objects.all():
        c.votes = 0
        c.save()

    # 🔄 reset student votes_cast
    for s in Student.objects.all():
        s.votes_cast = 0
        s.save()

    # ❌ stop election
    ElectionStatus.objects.update(is_active=False)

    return Response({"msg": "✅ Election reset done"})