import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studysync_core.settings')
django.setup()

from authentication.models import User, UserRole
from collaboration.models import (
    StudyRoom,
    GroupMembership,
    GroupRole,
    RoomCategory,
    ChatMessage,
    MessageType,
    DirectMessage,
    CollaborativeDocument,
    TaskItem,
    TaskStatus,
    TaskPriority,
    SharedResource,
    WhiteboardState
)

def seed():
    print("[INFO] Seeding database with academic collaboration demo data...")

    # Clear existing data
    WhiteboardState.objects.all().delete()
    SharedResource.objects.all().delete()
    TaskItem.objects.all().delete()
    CollaborativeDocument.objects.all().delete()
    ChatMessage.objects.all().delete()
    DirectMessage.objects.all().delete()
    GroupMembership.objects.all().delete()
    StudyRoom.objects.all().delete()
    User.objects.all().delete()

    # 1. Create Users
    prof_alan = User.objects.create_user(
        username='prof_alan',
        email='alan@mit.edu',
        password='password123',
        first_name='Alan',
        last_name='Turing',
        role=UserRole.INSTRUCTOR,
        institution='MIT / Computer Science & AI Lab',
        major_or_department='Artificial Intelligence',
        bio='Professor of Computer Science. Researching neural networks and distributed learning systems.',
        avatar_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        study_streak_days=45,
        total_study_minutes=2400,
        is_online=True
    )

    dr_grace = User.objects.create_user(
        username='dr_grace',
        email='grace@mit.edu',
        password='password123',
        first_name='Grace',
        last_name='Hopper',
        role=UserRole.INSTRUCTOR,
        institution='Harvard School of Engineering',
        major_or_department='Systems & Compilers',
        bio='Associate Professor. Passionate about real-time systems, concurrency, and algorithm optimization.',
        avatar_url='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        study_streak_days=30,
        total_study_minutes=1800,
        is_online=True
    )

    alex = User.objects.create_user(
        username='alex_chen',
        email='alex@stanford.edu',
        password='password123',
        first_name='Alex',
        last_name='Chen',
        role=UserRole.STUDENT,
        institution='Stanford University',
        major_or_department='Computer Science & Applied Math',
        bio='Senior Undergraduate. Focusing on Distributed Systems, WebSockets, and Full Stack Architecture.',
        avatar_url='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        study_streak_days=18,
        total_study_minutes=980,
        is_online=True
    )

    sarah = User.objects.create_user(
        username='sarah_j',
        email='sarah@stanford.edu',
        password='password123',
        first_name='Sarah',
        last_name='Jenkins',
        role=UserRole.STUDENT,
        institution='Stanford University',
        major_or_department='Data Science & AI',
        bio='Junior Data Science Major. Machine learning enthusiast and competitive programmer.',
        avatar_url='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        study_streak_days=12,
        total_study_minutes=720,
        is_online=True
    )

    marcus = User.objects.create_user(
        username='marcus_ta',
        email='marcus@stanford.edu',
        password='password123',
        first_name='Marcus',
        last_name='Aurelius',
        role=UserRole.TA,
        institution='Stanford University',
        major_or_department='Theoretical CS',
        bio='Graduate TA for CS161 Algorithms. Office hours Thursdays 4-6 PM.',
        avatar_url='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        study_streak_days=22,
        total_study_minutes=1400,
        is_online=True
    )

    elena = User.objects.create_user(
        username='elena_r',
        email='elena@oxford.edu',
        password='password123',
        first_name='Elena',
        last_name='Rostova',
        role=UserRole.STUDENT,
        institution='Oxford University',
        major_or_department='Mathematics & Physics',
        bio='Mathematics Scholar. Passionate about algebraic topology and quantum computing.',
        avatar_url='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        study_streak_days=25,
        total_study_minutes=1150,
        is_online=False
    )

    # 2. Create Study Rooms
    room_ml = StudyRoom.objects.create(
        name='Machine Learning & Deep Neural Nets',
        course_code='CS229',
        description='Collaborative workspace for CS229: Backprop derivation, Transformer architectures, attention mechanisms, and PyTorch optimization.',
        category=RoomCategory.ARTIFICIAL_INTELLIGENCE,
        owner=prof_alan,
        banner_url='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        members_count=4,
        max_members=40
    )

    room_algo = StudyRoom.objects.create(
        name='Design and Analysis of Algorithms',
        course_code='CS161',
        description='Dynamic Programming, Graph Theory (Dijkstra/A*), Minimum Spanning Trees, Network Flow, and NP-Completeness problem sets.',
        category=RoomCategory.COMPUTER_SCIENCE,
        owner=dr_grace,
        banner_url='https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        members_count=4,
        max_members=50
    )

    room_math = StudyRoom.objects.create(
        name='Linear Algebra & Multivariable Calculus',
        course_code='MATH51',
        description='Eigenvalues, SVD matrix decomposition, Vector calculus, Gradient fields, and Taylor series expansions.',
        category=RoomCategory.MATHEMATICS,
        owner=alex,
        banner_url='https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
        members_count=3,
        max_members=30
    )

    room_physics = StudyRoom.objects.create(
        name='Quantum Mechanics & Electrodynamics',
        course_code='PHYS21',
        description='Schrödinger Wave Equation, Quantum tunneling, Maxwell equations, and Harmonic oscillators.',
        category=RoomCategory.PHYSICS_ENGINEERING,
        owner=elena,
        banner_url='https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800&auto=format&fit=crop&q=80',
        members_count=2,
        max_members=25
    )

    # 3. Create Group Memberships
    # Room ML
    GroupMembership.objects.create(user=prof_alan, room=room_ml, role=GroupRole.LEADER)
    GroupMembership.objects.create(user=alex, room=room_ml, role=GroupRole.MEMBER)
    GroupMembership.objects.create(user=sarah, room=room_ml, role=GroupRole.MEMBER)
    GroupMembership.objects.create(user=marcus, room=room_ml, role=GroupRole.MODERATOR)

    # Room Algo
    GroupMembership.objects.create(user=dr_grace, room=room_algo, role=GroupRole.LEADER)
    GroupMembership.objects.create(user=marcus, room=room_algo, role=GroupRole.MODERATOR)
    GroupMembership.objects.create(user=alex, room=room_algo, role=GroupRole.MEMBER)
    GroupMembership.objects.create(user=sarah, room=room_algo, role=GroupRole.MEMBER)

    # Room Math
    GroupMembership.objects.create(user=alex, room=room_math, role=GroupRole.LEADER)
    GroupMembership.objects.create(user=elena, room=room_math, role=GroupRole.MODERATOR)
    GroupMembership.objects.create(user=sarah, room=room_math, role=GroupRole.MEMBER)

    # Room Physics
    GroupMembership.objects.create(user=elena, room=room_physics, role=GroupRole.LEADER)
    GroupMembership.objects.create(user=alex, room=room_physics, role=GroupRole.MEMBER)

    # 4. Create Chat Messages
    ChatMessage.objects.create(
        room=room_ml,
        sender=prof_alan,
        message_type=MessageType.TEXT,
        content="Welcome to the CS229 Study Hub! Today we'll review the self-attention formula in Transformers: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V."
    )
    ChatMessage.objects.create(
        room=room_ml,
        sender=sarah,
        message_type=MessageType.TEXT,
        content="Thanks Professor! I was looking over the scaling factor sqrt(d_k). Does it prevent small gradients in softmax when dimension is large?"
    )
    ChatMessage.objects.create(
        room=room_ml,
        sender=alex,
        message_type=MessageType.CODE,
        code_language="python",
        content="import torch\nimport torch.nn.functional as F\n\ndef scaled_dot_product_attention(q, k, v, mask=None):\n    d_k = q.size(-1)\n    scores = torch.matmul(q, k.transpose(-2, -1)) / (d_k ** 0.5)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, -1e9)\n    p_attn = F.softmax(scores, dim=-1)\n    return torch.matmul(p_attn, v), p_attn"
    )
    ChatMessage.objects.create(
        room=room_ml,
        sender=prof_alan,
        message_type=MessageType.TEXT,
        content="Exactly Alex! Beautiful PyTorch implementation. The dot products grow large in magnitude for high d_k, pushing softmax into regions with extremely small gradients."
    )

    # Messages in Algo Room
    ChatMessage.objects.create(
        room=room_algo,
        sender=dr_grace,
        message_type=MessageType.TEXT,
        content="Problem Set 3 is live. Focus on DP state transitions for the Longest Common Subsequence problem."
    )
    ChatMessage.objects.create(
        room=room_algo,
        sender=marcus,
        message_type=MessageType.TEXT,
        content="Office hours are open right now in this room. Drop any questions regarding Big-O asymptotic analysis or recurrence relations!"
    )
    ChatMessage.objects.create(
        room=room_algo,
        sender=alex,
        message_type=MessageType.CODE,
        code_language="python",
        content="def lcs(X, Y):\n    m, n = len(X), len(Y)\n    dp = [[0]*(n+1) for _ in range(m+1)]\n    for i in range(1, m+1):\n        for j in range(1, n+1):\n            if X[i-1] == Y[j-1]:\n                dp[i][j] = dp[i-1][j-1] + 1\n            else:\n                dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n    return dp[m][n]"
    )

    # 5. Direct Messages
    DirectMessage.objects.create(
        sender=sarah,
        recipient=alex,
        content="Hey Alex, are you free for a 30-minute Pomodoro session on Problem Set 3 tonight?",
        is_read=True
    )
    DirectMessage.objects.create(
        sender=alex,
        recipient=sarah,
        content="Definitely! Let's jump into the CS161 room at 7:00 PM.",
        is_read=True
    )

    # 6. Collaborative Documents
    CollaborativeDocument.objects.create(
        room=room_ml,
        title="CS229 Midterm Study Guide & Cheat Sheet",
        content="""# 🧠 CS229: Machine Learning Midterm Review

## 1. Linear & Logistic Regression
- **Loss Function**: Mean Squared Error vs Binary Cross-Entropy
- **Gradient Descent Update**: $\\theta_j := \\theta_j - \\alpha \\frac{\\partial J}{\\partial \\theta_j}$
- **Regularization**: 
  - L2 (Ridge): $J(\\theta) + \\lambda ||\\theta||_2^2$ (prevents large weights)
  - L1 (Lasso): $J(\\theta) + \\lambda ||\\theta||_1$ (promotes sparsity)

## 2. Deep Learning & Transformer Architecture
- **Multi-Head Attention**: $\\text{MHA}(Q, K, V) = \\text{Concat}(\\text{head}_1, ..., \\text{head}_h)W^O$
- **Layer Normalization**: $\\text{LayerNorm}(x) = \\frac{x - \\mu}{\\sigma + \\epsilon} \\cdot \\gamma + \\beta$
- **Optimization**: AdamW, Learning Rate Warmup & Cosine Annealing

## 3. High-Priority Study Checklist:
- [x] Matrix calculus identities
- [x] Backpropagation computational graph walkthrough
- [ ] Support Vector Machines (Lagrange Multipliers & KKT conditions)
""",
        last_modified_by=prof_alan
    )

    CollaborativeDocument.objects.create(
        room=room_algo,
        title="CS161 Dynamic Programming Patterns",
        content="""# ⚡ CS161 Dynamic Programming Master Framework

### 5-Step Recipe for DP:
1. **Define Subproblems**: State dimensions and their physical meaning.
2. **Guess (part of solution)**: Options available at state $(i, j)$.
3. **Relate Subproblem Solutions**: Write down the Bellman recurrence relation.
4. **Recurse & Memoize OR Bottom-Up Tabulation**: Determine topological ordering.
5. **Solve Original Problem**: Combine answers or read final cell `dp[n]`.
""",
        last_modified_by=dr_grace
    )

    # 7. Kanban Task Items
    TaskItem.objects.create(
        room=room_ml,
        title="Implement Multi-Head Attention in PyTorch",
        description="Write clean vectorized code for query, key, value projections and test with tensor shape (batch, seq_len, embed_dim).",
        status=TaskStatus.DONE,
        priority=TaskPriority.HIGH,
        assigned_to=alex,
        created_by=prof_alan
    )
    TaskItem.objects.create(
        room=room_ml,
        title="Derive Backpropagation Gradients for Cross-Entropy",
        description="Write the mathematical proof on LaTeX / markdown collaborative notes.",
        status=TaskStatus.IN_PROGRESS,
        priority=TaskPriority.MEDIUM,
        assigned_to=sarah,
        created_by=prof_alan
    )
    TaskItem.objects.create(
        room=room_ml,
        title="Prepare Dataset for Distributed Training Benchmark",
        description="Download and tokenize the WikiText-103 dataset using HuggingFace Tokenizers.",
        status=TaskStatus.TODO,
        priority=TaskPriority.LOW,
        assigned_to=marcus,
        created_by=prof_alan
    )

    TaskItem.objects.create(
        room=room_algo,
        title="Implement Dijkstra with Fibonacci Heap in Python",
        description="Benchmark performance against standard binary heap on dense graphs.",
        status=TaskStatus.IN_PROGRESS,
        priority=TaskPriority.HIGH,
        assigned_to=alex,
        created_by=dr_grace
    )
    TaskItem.objects.create(
        room=room_algo,
        title="Complete Homework 4 Reduction Proofs",
        description="Prove 3-SAT reduces to Independent Set in polynomial time.",
        status=TaskStatus.TODO,
        priority=TaskPriority.HIGH,
        assigned_to=sarah,
        created_by=marcus
    )

    # 8. Shared Resources
    SharedResource.objects.create(
        room=room_ml,
        title="Attention Is All You Need (Vaswani et al.) - Annotated PDF",
        description="Key paper that introduced the Transformer architecture with margin notes on Positional Encodings.",
        resource_type="Research Paper",
        file_url="https://arxiv.org/pdf/1706.03762",
        file_size_bytes=2202000,
        uploaded_by=prof_alan,
        download_count=42
    )
    SharedResource.objects.create(
        room=room_ml,
        title="PyTorch Deep Learning Cheat Sheet v2.0",
        description="Quick reference for torch.autograd, custom layers, CUDA memory management, and DataLoader multiprocessing.",
        resource_type="Cheat Sheet",
        file_url="https://pytorch.org/tutorials/beginner/ptcheat.html",
        file_size_bytes=850000,
        uploaded_by=alex,
        download_count=78
    )
    SharedResource.objects.create(
        room=room_algo,
        title="MIT 6.006 Algorithms Lecture Notes & Recurrences",
        description="Comprehensive summary of Master Theorem, graph algorithms, and amortized analysis.",
        resource_type="Lecture Notes",
        file_url="https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
        file_size_bytes=3400000,
        uploaded_by=dr_grace,
        download_count=65
    )

    # 9. Whiteboard Initial States
    WhiteboardState.objects.create(
        room=room_ml,
        elements_json='[{"type":"rect","x":50,"y":50,"width":160,"height":60,"color":"#3b82f6","label":"Input Embeddings"},{"type":"arrow","fromX":130,"fromY":110,"toX":130,"toY":160,"color":"#94a3b8"},{"type":"rect","x":50,"y":160,"width":160,"height":80,"color":"#8b5cf6","label":"Multi-Head\\nAttention"},{"type":"arrow","fromX":130,"fromY":240,"toX":130,"toY":290,"color":"#94a3b8"},{"type":"rect","x":50,"y":290,"width":160,"height":60,"color":"#10b981","label":"Feed Forward"}]',
        last_updated_by=prof_alan
    )
    WhiteboardState.objects.create(
        room=room_algo,
        elements_json='[{"type":"circle","x":100,"y":100,"radius":30,"color":"#ef4444","label":"Start S"},{"type":"arrow","fromX":130,"fromY":100,"toX":220,"toY":100,"color":"#94a3b8"},{"type":"circle","x":250,"y":100,"radius":30,"color":"#3b82f6","label":"Node A"},{"type":"arrow","fromX":250,"fromY":130,"toX":250,"toY":220,"color":"#94a3b8"},{"type":"circle","x":250,"y":250,"radius":30,"color":"#10b981","label":"Target T"}]',
        last_updated_by=dr_grace
    )

    print("[SUCCESS] Seed data populated successfully!")
    print(f"Users created: {User.objects.count()}")
    print(f"Study Rooms created: {StudyRoom.objects.count()}")
    print(f"Messages created: {ChatMessage.objects.count()}")
    print(f"Tasks created: {TaskItem.objects.count()}")
    print(f"Resources created: {SharedResource.objects.count()}")

if __name__ == '__main__':
    seed()
