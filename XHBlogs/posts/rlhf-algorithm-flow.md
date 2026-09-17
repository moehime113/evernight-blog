---
title: "RLHF算法原理讲解：让大模型对齐人类偏好"
date: "2026-05-21"
description: "深入拆解 RLHF（基于人类反馈的强化学习）的完整算法流程——从 SFT 到奖励模型、PPO，再到 DPO，理解 LLM 如何从预测下一个 token 走向对齐人类偏好"
cover: "/img/dusays-69ec73f349b53.jpg"
---

## 预训练之后，模型真的"好用"了吗？

一个在海量语料上完成自回归预训练的 LLM，本质上是一个极强的**下一个 token 预测器**。给定前缀，它能以很高概率续写出通顺、知识密集，甚至风格鲜明的文本；但它并不天然知道什么答案是"有用的"、什么是"无害的"，也不知道用户下达指令时，自己应该以助手口吻回答，而不是继续补全一段互联网文本。

如果你问它"怎么造炸弹"，基座模型可能会认真罗列步骤。不是因为它有恶意，而是因为它的训练目标只是最大化条件语言模型概率：


\[
\max_\theta \; \mathbb{E}_{x \sim \mathcal{D}} \left[ \sum_t \log \pi_\theta(x_t \mid x_{\lt t}) \right]
\]


这个目标从未告诉模型：有些问题不该回答，有些回答虽然"像训练语料"，却不符合人类期望。

**RLHF（Reinforcement Learning from Human Feedback）** 正是为了解决这一类对齐问题而形成的经典范式。它在 OpenAI 的 InstructGPT 论文中被系统化使用，随后成为 ChatGPT、Claude、Llama 等对话模型的重要对齐流程之一。

整条 RLHF 流水线主要包含三个阶段：监督微调 (SFT)、奖励模型 (RM) 的训练以及基于 PPO 的策略优化。

---

## Step 1：监督微调（SFT）

### 动机

基座模型的默认行为是"补全"，不是"回应"。SFT（Supervised Fine-Tuning）的目标，是用高质量人工示范数据告诉模型：面对一条用户指令时，理想回答应该长什么样。

换句话说，SFT 不是让模型从零学会语言，而是把它从"续写器"推向"助手"。

### 数据构造

标注团队会为一批 prompt 编写高质量回答，形成示范数据集：

```text

```

例如：

prompt \(x\)demonstration \(y\)解释什么是光合作用光合作用是植物利用光能，将二氧化碳和水转化为葡萄糖和氧气的过程……用 Python 写一个冒泡排序`def bubble_sort(arr): ...`

数据规模通常在几千到几万条。这里的关键不是越多越好，而是覆盖足够多样的任务类型，并且回答质量稳定。

### 训练目标

SFT 仍然使用标准的因果语言建模目标，只是训练数据从互联网文本变成了"指令—回答"对：


\[
\mathcal{L}_{\mathrm{SFT}}(\theta)
= -\mathbb{E}_{(x,y) \sim \mathcal{D}_{\mathrm{SFT}}}
\left[ \sum_{t=1}^{|y|} \log \pi_\theta(y_t \mid x, y_{\lt t}) \right]
\]


直观地说，这一步就是让模型逐 token 模仿标注员的回答。实际训练时，通常只让回答部分 \(y\) 参与 loss 计算，prompt 部分 \(x\) 作为条件上下文，不作为预测目标。

SFT 之后，模型已经初步学会"听指令、给回答"。但它仍有一个关键问题：**它不知道同一个 prompt 下，两个候选回答哪一个更符合人类偏好**。SFT 只能模仿单条示范，不能直接学习"回答之间的优劣排序"。这正是奖励模型要解决的问题。

---

## Step 2：训练奖励模型（Reward Model）

### 为什么需要奖励模型？

最理想的做法当然是让人类实时评判模型输出，然后直接把这些评价用于训练。但把人类放进每一步训练循环并不现实：速度太慢，成本太高，而且不同标注者的绝对评分标准也会明显波动。

RLHF 的解决思路是：**先用人类偏好数据训练一个"模拟裁判"**。这个裁判就是奖励模型（Reward Model, RM）。后续强化学习阶段中，RM 会替代真实人类，为模型生成的回答给出奖励信号。

### 数据构造：偏好比较而非绝对打分

RM 通常不直接学习"这个回答是 4 分还是 5 分"，而是学习"回答 A 是否优于回答 B"。原因很简单：绝对打分的标注方差很大，而二选一或排序比较更稳定、更容易复现。

具体流程是：对同一个 prompt \(x\)，用当前模型采样出多个回答 \({y_1, y_2, \ldots, y_K}\)，让标注员选择更好的回答，从而构建偏好数据集：

```text

```

这里的 \(y_w\) 和 \(y_l\) 不一定意味着"完美回答"和"错误回答"，只表示在同一个 prompt 下，人类更偏好前者。

### 模型架构

RM 通常从 SFT 模型初始化，这样它已经具备基本的语言理解和指令理解能力。随后把最后的 LM head（输出词表分布）替换为一个标量输出头，让模型对完整的 \((x, y)\) 序列输出一个实数奖励：

```text

```

这个标量 \(r_\theta(x,y)\) 就是奖励模型对"回答 \(y\) 有多好"的预测。

实践中，常把 prompt 和 answer 拼接后送入 RM，并在回答末尾加入特殊的 `<EOS>` token，用该位置的 hidden state 表示整段回答。这样比直接取最后一个普通 token 更稳定。

### 训练目标：Bradley-Terry 偏好模型

RM 的训练目标通常基于 Bradley-Terry 模型。它假设人类偏好 \(y_w\) 胜过 \(y_l\) 的概率，由两者奖励差的 sigmoid 给出：


\[
P(y_w \succ y_l \mid x)
= \sigma\left(r_\theta(x, y_w) - r_\theta(x, y_l)\right)
\]


其中：


\[
\sigma(z) = \frac{1}{1 + e^{-z}}
\]


如果 \(r_\theta(x,y_w)\) 比 \(r_\theta(x,y_l)\) 大很多，那么模型认为"chosen 更好"的概率接近 1；如果两者奖励接近，偏好概率就接近 0.5。

于是 RM 的损失函数就是负对数似然：


\[
\mathcal{L}_{\mathrm{RM}}(\theta)
= -\mathbb{E}_{(x,y_w,y_l) \sim \mathcal{D}_{\mathrm{RM}}}
\left[
\log \sigma\left(r_\theta(x,y_w) - r_\theta(x,y_l)\right)
\right]
\]


梯度方向非常直观：**拉大 chosen 与 rejected 之间的奖励差距**。当奖励差很小时，loss 大，模型会被推动着更明确地区分二者；当 chosen 的奖励已经明显高于 rejected 时，sigmoid 接近饱和，loss 逐渐趋近于零。

---

## Step 3：PPO 强化学习微调

### 强化学习视角下的 LLM

完成 SFT 和 RM 后，我们手里有三个关键对象：

角色记号功能当前策略\(\pi_\phi\)待优化的 LLM，从 SFT 初始化，负责生成回答参考策略\(\pi_{\mathrm{ref}}\)冻结的 SFT 模型，用来限制策略漂移奖励模型\(r_\theta\)冻结的 RM，给 \((x,y)\) 输出标量奖励

从强化学习角度看，prompt 是初始状态，模型逐 token 采样动作，完整回答是一条 trajectory，RM 在序列末尾给出主要奖励。

### 奖励信号：RM 分数 + KL 约束

如果直接最大化 RM 分数，会遇到典型的**奖励黑客（reward hacking）**：策略可能学会生成某些人类不喜欢、但 RM 错误高估的模式，比如重复模板、堆砌安全话术，甚至输出异常符号。

因此 RLHF 通常不会只优化 \(r_\theta(x,y)\)，而是加入相对于参考模型的 KL 惩罚：


\[
R(x,y)
= r_\theta(x,y)
- \beta \log \frac{\pi_\phi(y \mid x)}{\pi_{\mathrm{ref}}(y \mid x)}
\]


等价地，可以写成期望形式：


\[
\max_\phi \; \mathbb{E}_{x \sim \mathcal{D},\, y \sim \pi_\phi(\cdot \mid x)}
\left[
 r_\theta(x,y)
 - \beta D_{\mathrm{KL}}\left(\pi_\phi(\cdot \mid x) \parallel \pi_{\mathrm{ref}}(\cdot \mid x)\right)
\right]
\]


这里的 \(\beta\) 控制约束强度：太小容易 reward hacking，太大则策略几乎无法偏离 SFT 模型。

在实现中，KL 惩罚通常按 token 近似累加：


\[
\log \frac{\pi_\phi(y \mid x)}{\pi_{\mathrm{ref}}(y \mid x)}
= \sum_{t=1}^{T}
\log \frac{\pi_\phi(y_t \mid x, y_{\lt t})}
{\pi_{\mathrm{ref}}(y_t \mid x, y_{\lt t})}
\]


这就是 RLHF 里"既追求高奖励，又不要离原来的语言模型太远"的核心约束。

### 数据采集循环

PPO 阶段是在线策略优化。每一轮训练大致如下：

```text

```

这里"当前策略自己生成回答"非常关键。PPO 是 on-policy 算法，更新所依赖的 rollout 必须来自当前或近似当前的策略，而不能完全替换成离线回答数据。

### PPO 的裁剪目标

PPO（Proximal Policy Optimization）的核心，是限制每次策略更新的幅度。对第 \(t\) 个 token，定义新旧策略概率比：


\[
\rho_t(\phi)
= \frac{\pi_\phi(a_t \mid s_t)}
{\pi_{\phi_{\mathrm{old}}}(a_t \mid s_t)}
\]


其中 \(s_t = (x, y_{\lt t})\)，\(a_t = y_t\)。PPO 的 clipped surrogate objective 写作：


\[
\mathcal{J}_{\mathrm{PPO}}(\phi)
= \mathbb{E}_t
\left[
\min\left(
\rho_t(\phi)\hat{A}_t,
\operatorname{clip}(\rho_t(\phi), 1-\epsilon, 1+\epsilon)\hat{A}_t
\right)
\right]
\]


其中：

- \(\hat{A}_t\)：第 \(t\) 步的优势估计（advantage estimate）
- \(\epsilon\)：裁剪阈值，常见取值为 0.1 或 0.2
- \(\pi_{\phi_{\mathrm{old}}}\)：采样 rollout 时使用的旧策略

当 \(\rho_t\) 偏离 1 太远时，clip 会截断目标函数的收益，避免一次更新把策略推得过远。直观地说：PPO 鼓励模型朝优势为正的方向改进，但不允许它一步跨得太大。

### 优势估计与价值函数

语言生成任务的奖励往往在序列末尾才由 RM 给出，因此需要把"整段回答的好坏"分配回每一个 token 决策。常用方法是 GAE（Generalized Advantage Estimation）：


\[
\hat{A}_t
= \sum_{l=0}^{T-t-1} (\gamma\lambda)^l \delta_{t+l}
\]


其中 TD 残差为：


\[
\delta_t = r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t)
\]


\(V_\phi(s_t)\) 是价值函数，用来预测从当前状态开始的期望未来回报。RLHF 实践中，value head 通常与 policy 共享 Transformer 主干，只在最后增加一个输出标量的线性层。

价值函数用均方误差训练：


\[
\mathcal{L}_V(\phi)
= \mathbb{E}_t \left[
\left(V_\phi(s_t) - \hat{R}_t\right)^2
\right]
\]


### PPO 阶段的总目标

如果把 PPO 写成"最大化目标"，常见形式是：


\[
\max_\phi \;
\mathcal{J}_{\mathrm{PPO}}(\phi)
- c_1 \mathcal{L}_V(\phi)
+ c_2 \mathcal{H}\left[\pi_\phi\right]
\]


三项分别对应：

项作用\(\mathcal{J}_{\mathrm{PPO}}\)最大化裁剪后的策略改进目标\(-c_1\mathcal{L}_V\)训练价值函数，使回报预测更准确\(c_2\mathcal{H}\pi_\phi\)熵奖励，鼓励策略保持一定探索性，避免过早塌缩

如果工程实现里使用梯度下降，则通常会最小化它的相反数，即把 policy objective 取负，再加上 value loss，并减去 entropy bonus。

---

## 全局视角：三种目标函数的分工

把三幕合在一起看，SFT、RM、PPO 的职责非常清晰：

```text

```

SFT 提供基础交互能力，RM 提供人类偏好的近似评判标准，PPO 则在 KL 约束下探索比 SFT 更符合偏好的策略。

可以把它理解成：

1. **SFT** 教模型"像一个助手一样回答"。
2. **RM** 教模型"什么样的回答更受人类偏好"。
3. **PPO** 让模型"在不偏离太远的前提下，主动寻找更好的回答"。

---

## DPO：RLHF 的简化替代

完整 RLHF 管线工程复杂度很高：要训练 RM，要维护参考模型，要在线采样，还要调 PPO、value head、KL 系数等一系列超参数。

2023 年提出的 **DPO（Direct Preference Optimization）** 给出了一条更简洁的路线：不显式训练 RM，也不运行 PPO，而是直接用偏好数据优化策略。

DPO 的关键洞察是，在带 KL 约束的最优策略形式中，奖励函数和策略之间存在如下关系：


\[
r(x,y)
= \beta \log \frac{\pi^*(y \mid x)}{\pi_{\mathrm{ref}}(y \mid x)}
+ \beta \log Z(x)
\]


将它代入 Bradley-Terry 偏好模型后，归一化项 \(Z(x)\) 会在 chosen 和 rejected 的差分中抵消，于是得到直接优化策略的损失：


\[
\mathcal{L}_{\mathrm{DPO}}(\pi_\theta; \pi_{\mathrm{ref}})
= -\mathbb{E}_{(x,y_w,y_l) \sim \mathcal{D}}
\left[
\log \sigma\left(
\beta \log \frac{\pi_\theta(y_w \mid x)}{\pi_{\mathrm{ref}}(y_w \mid x)}
-
\beta \log \frac{\pi_\theta(y_l \mid x)}{\pi_{\mathrm{ref}}(y_l \mid x)}
\right)
\right]
\]


DPO 的含义很直观：相对于参考模型，提升 chosen 的生成概率，压低 rejected 的生成概率。它不需要显式 RM，也不需要 PPO 的在线 rollout 和价值函数。

维度PPO-style RLHFDPO显式 RM需要不需要在线采样需要不需要，使用离线偏好数据价值函数通常需要不需要工程复杂度高低灵活性更容易接入复杂奖励更依赖已有偏好数据覆盖

因此，资源充足的团队仍可能选择完整 PPO 管线或其变体（例如 GRPO、RLOO 等），而开源社区和中小团队常更青睐 DPO、IPO、KTO 这类更轻量的偏好优化方法。

---

## 总结

RLHF 解决的是预训练 LLM "能力强但不一定听话"的问题。它不是让模型突然拥有价值观，而是通过一套可训练的算法流程，把人类偏好压进模型的行为分布里。

从算法角度看，它是三段渐进式精炼：

1. **SFT**：用人工示范教模型如何回答。
2. **RM**：用偏好比较训练一个会打分的裁判。
3. **PPO**：在裁判引导和 KL 约束下优化策略。

理解 RLHF，就是理解为什么对话模型不只是"知道下一个 token 可能是什么"，还会学习"在这个上下文里，什么样的回答更应该被说出来。

